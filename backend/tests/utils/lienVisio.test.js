import { LONGUEUR_MAX_LIEN_VISIO, domaineDuLien, lienVisioValide, motifLienVisioRefuse } from "../../../shared/lienVisio.js";

// Lien de visio d'une séance à distance (lot EC-11, règle V-2)
describe("lien de visio", () => {
    test.each(["https://meet.google.com/abc-defg-hij", "https://teams.microsoft.com/l/meetup-join/19%3a", "https://ecole.zoom.us/j/123?pwd=x", "  https://bbb.exemple.ma/b/abc  "])("accepté : %s", (adresse) => {
        expect(lienVisioValide(adresse)).toBe(true);
    });

    test.each([
        ["http://meet.google.com/abc", "https"],
        ["javascript:alert(1)", "https"],
        ["data:text/html,<script>alert(1)</script>", "https"],
        ["ftp://exemple.ma/salle", "https"],
        ["meet.google.com/abc", "adresse"],
        ["", "adresse"],
        ["https://localhost/salle", "hote"],
        ["https://intranet./salle", "hote"],
        ["https://nom:secret@meet.google.com/abc", "identifiants"],
        ["https://nom@meet.google.com/abc", "identifiants"],
        [`https://meet.google.com/${"a".repeat(LONGUEUR_MAX_LIEN_VISIO)}`, "longueur"],
    ])("refusé : %s (%s)", (adresse, motif) => {
        expect(motifLienVisioRefuse(adresse)).toBe(motif);
        expect(lienVisioValide(adresse)).toBe(false);
    });

    test("le bouton montre le nom de domaine, sans « www. »", () => {
        expect(domaineDuLien("https://www.zoom.us/j/1")).toBe("zoom.us");
        expect(domaineDuLien("https://meet.google.com/abc")).toBe("meet.google.com");
        expect(domaineDuLien("pas une adresse")).toBe("");
    });
});
