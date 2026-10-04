package ma.hestim.solver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Service de génération de la semaine type (Timefold), appelé uniquement par Planner. */
@SpringBootApplication
public class SolverApplication {

    public static void main(String[] args) {
        SpringApplication.run(SolverApplication.class, args);
    }
}
