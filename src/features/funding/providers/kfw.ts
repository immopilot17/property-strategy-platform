import { OfficialWebProvider } from "./web-provider";

export class KfwProvider extends OfficialWebProvider {
  id = "kfw";
  name = "KfW";
  allowedHost = "www.kfw.de";
  catalogUrls = [
    "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Neubau/index.html",
    "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestandsimmobilie/F%C3%B6rderprodukte/F%C3%B6rderprodukte-f%C3%BCr-Bestandsimmobilien.html"
  ];
  isProgramUrl(url: URL) { return /\/F%C3%B6rderprodukte\/.+\(\d+(?:-\d+)?\)\//i.test(url.pathname) || /\/Förderprodukte\/.+\(\d+(?:-\d+)?\)\//i.test(decodeURI(url.pathname)); }
}
