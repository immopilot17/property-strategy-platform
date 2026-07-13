import { OfficialWebProvider } from "./web-provider";

export class KfwProvider extends OfficialWebProvider {
  id = "kfw";
  name = "KfW";
  allowedHost = "www.kfw.de";
  catalogUrls = [
    "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Neubau/index.html",
    "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestandsimmobilie/F%C3%B6rderprodukte/F%C3%B6rderprodukte-f%C3%BCr-Bestandsimmobilien.html"
  ];
  private readonly supportedPrograms = new Set(["124", "159", "261-262", "296", "297-298", "300", "308", "358-359", "455", "458"]);

  isProgramUrl(url: URL) {
    const match = url.pathname.match(/\/F%C3%B6rderprodukte\/.+\((\d+(?:-\d+)?)\)\/$/i);
    return Boolean(match && this.supportedPrograms.has(match[1]));
  }
}
