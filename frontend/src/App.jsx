import React from "react";
import Input from "./components/common/Input";
import Password from "./components/common/Password";
import Listoption from "./components/common/Listoption";
import Connexion from "./pages/Connexion";
import Navbar from "./components/common/Navbar";
import Header from "./components/common/Header";
import './App.css';
import Accueil from "./pages/Accueil";
import Checkbox from "./components/common/Checkbox";
import Link from "./components/common/Link";
import Buton from "./components/common/Buton";
export default function App() {
    return <div>
        <Header />
        <Connexion />
        <Input placeholder={"votre.email@hestim.ma"}/>
        <Password />
        <Listoption />
        <Checkbox />
        <Link label={"Password forget ?"}/>
        <Buton label={"Connexion"}/>
    </div>;
}
