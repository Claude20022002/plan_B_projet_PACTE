package ma.hestim.solver.securite;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Seul Planner appelle ce service, sur le réseau interne. En plus de ce cloisonnement, chaque
 * appel (hors /health) porte le jeton partagé SOLVER_TOKEN dans l'en-tête X-Solver-Token,
 * comparé en temps constant. Sans jeton configuré, le service refuse tout calcul plutôt que
 * de rester ouvert. Le corps d'un POST est borné (taille déclarée obligatoire).
 */
@Component
public class JetonFiltre extends OncePerRequestFilter {

    static final String EN_TETE = "X-Solver-Token";

    private final byte[] jeton;
    private final long tailleMax;

    public JetonFiltre(@Value("${solver.jeton:}") String jeton, @Value("${solver.taille-max-octets:5242880}") long tailleMax) {
        this.jeton = jeton.getBytes(StandardCharsets.UTF_8);
        this.tailleMax = tailleMax;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest requete) {
        return "/health".equals(requete.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requete, HttpServletResponse reponse, FilterChain suite)
            throws ServletException, IOException {
        if (jeton.length < 32) {
            refuser(reponse, HttpStatus.SERVICE_UNAVAILABLE, "Jeton du service absent ou trop court (SOLVER_TOKEN, 32 caractères au moins)");
            return;
        }
        String recu = requete.getHeader(EN_TETE);
        if (recu == null || !MessageDigest.isEqual(jeton, recu.getBytes(StandardCharsets.UTF_8))) {
            refuser(reponse, HttpStatus.UNAUTHORIZED, "Jeton du service invalide");
            return;
        }
        if ("POST".equals(requete.getMethod()) && (requete.getContentLengthLong() < 0 || requete.getContentLengthLong() > tailleMax)) {
            refuser(reponse, HttpStatus.PAYLOAD_TOO_LARGE, "Problème trop volumineux ou de taille non déclarée");
            return;
        }
        suite.doFilter(requete, reponse);
    }

    private static void refuser(HttpServletResponse reponse, HttpStatus statut, String message) throws IOException {
        reponse.setStatus(statut.value());
        reponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
        reponse.setCharacterEncoding("UTF-8");
        reponse.getWriter().write("{\"erreur\":\"" + message + "\"}");
    }
}
