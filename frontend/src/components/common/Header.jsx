import Buton from "./Buton";
import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { NavLink } from "react-router-dom";

// MUI theming example (not used currently)
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#001962",
        },
        secondary: {
            main: "#9747FF",
        },
        hover: {
            default: "#6B91FF",
        },
    },
});

export default function Header() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar
                sx={{
                    background:
                        "linear-gradient(90deg, #001062 0%, #1a3a8f 100%)",
                    boxShadow: "none",
                    pt: 2,
                    px: 6,
                }}
                position="static"
            >
                <Toolbar
                    sx={{ display: "flex", justifyContent: "space-between" }}
                >
                    {/* Logo */}

                    <Box
                        component="img"
                        src="/HESTIM.png"
                        alt="HESTIM Logo"
                        sx={{
                            width: { xs: "160px", md: "220px" },
                            height: { xs: "40px", md: "60px" },
                            objectFit: "contain",
                            padding: "8px 12px",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        }}
                    />
                </Toolbar>
            </AppBar>
        </Box>
    );
}

// }
