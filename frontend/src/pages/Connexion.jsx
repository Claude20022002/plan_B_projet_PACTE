import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Input from "../components/common/Input";
import Password from "../components/common/Password";
import Listoption from "../components/common/Listoption";
import Checkbox from "../components/common/Checkbox";
import Link from "../components/common/Link";
import Buton from "../components/common/Buton";

export default function Connexion() {
return (
    <Box
        sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f5f6fb",
        }}
    >
        <Box
            sx={{
                width: { xs: "100%", sm: 750 },
                height: { xs: "auto", sm: 550 },
                display: "flex",
                borderRadius: 4,
                boxShadow: 3,
                overflow: "hidden",
                bgcolor: "white",
            }}
        >
            {/* Fond bleu + image */}
            <Box
                sx={{
                    width: { xs: "0%", sm: "40%" },
                    minWidth: { sm: "45%" },
                    bgcolor: "primary.main",
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    borderRadius: "0 25px 25px 0",
                }}
            >
                <Box
                    component="img"
                    src="/logo-planner.png"
                    alt="Connexion Illustration"
                    sx={{
                        width: 250,
                        mb: 2,
                    }}
                />
            </Box>
            {/* Formulaire et message */}
            <Box
                sx={{
                    flex: 1,
                    p: { xs: 3, sm: 5 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 2,
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={700}
                    align="left"
                    color="primary"
                    sx={{ mb: 1 }}
                >
                    Bienvenue à HESTIM
                </Typography>
                <Typography
                    variant="body1"
                    align="left"
                    color="text.secondary"
                    sx={{ mb: 3, fontSize: 15 }}
                >
                    Connectez-vous à votre compte pour accéder à la plateforme HESTIM.
                </Typography>
                <Input placeholder={"votre.email@hestim.ma"} />
                <Password />
                <Listoption />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                    <Checkbox label="Remember me" />
                    <Link label={"Mot de passe oublié ?"} />
                </Box>
                <Buton label={"Connexion"} />
            </Box>
        </Box>
    </Box>
);
}

