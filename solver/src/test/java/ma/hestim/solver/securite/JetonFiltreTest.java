package ma.hestim.solver.securite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/** Le service n'accepte que Planner (jeton partagé) et borne la taille des problèmes. */
class JetonFiltreTest {

    private static final String JETON = "0123456789abcdef0123456789abcdef";

    private static MockHttpServletResponse appeler(JetonFiltre filtre, String methode, String chemin, String jeton, byte[] corps) throws Exception {
        MockHttpServletRequest requete = new MockHttpServletRequest(methode, chemin);
        if (jeton != null) {
            requete.addHeader(JetonFiltre.EN_TETE, jeton);
        }
        if (corps != null) {
            requete.setContent(corps);
        }
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        MockFilterChain suite = new MockFilterChain();
        filtre.doFilter(requete, reponse, suite);
        if (reponse.getStatus() == 200) {
            assertNotNull(suite.getRequest(), "la requête doit être transmise");
        } else {
            assertNull(suite.getRequest(), "la requête ne doit pas être transmise");
        }
        return reponse;
    }

    @Test
    void jetonObligatoireEtComparé() throws Exception {
        JetonFiltre filtre = new JetonFiltre(JETON, 1000);
        assertEquals(401, appeler(filtre, "GET", "/timetables/x", null, null).getStatus());
        assertEquals(401, appeler(filtre, "GET", "/timetables/x", JETON + "x", null).getStatus());
        assertEquals(200, appeler(filtre, "GET", "/timetables/x", JETON, null).getStatus());
        // La sonde de santé reste ouverte (healthcheck Docker)
        assertEquals(200, appeler(filtre, "GET", "/health", null, null).getStatus());
    }

    @Test
    void sansJetonConfiguréLeServiceRefuse() throws Exception {
        assertEquals(503, appeler(new JetonFiltre("", 1000), "GET", "/timetables/x", "", null).getStatus());
        assertEquals(503, appeler(new JetonFiltre("court", 1000), "GET", "/timetables/x", "court", null).getStatus());
    }

    @Test
    void corpsBorné() throws Exception {
        JetonFiltre filtre = new JetonFiltre(JETON, 10);
        assertEquals(413, appeler(filtre, "POST", "/timetables", JETON, new byte[11]).getStatus());
        assertEquals(200, appeler(filtre, "POST", "/timetables", JETON, new byte[10]).getStatus());
    }
}
