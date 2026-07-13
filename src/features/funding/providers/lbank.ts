import { OfficialWebProvider } from "./web-provider";

export class LBankProvider extends OfficialWebProvider {
  id = "lbank";
  name = "L-Bank";
  allowedHost = "www.l-bank.de";
  catalogUrls = ["https://www.l-bank.de/produkte?query=&facetFilter=%7B%22zielgruppe%22%3A%5B%22Privatpersonen%22%5D%2C%22thema%22%3A%5B%22Bauen+und+Wohnen%22%5D%7D"];
  private readonly supportedPrograms = new Set([
    "/produkte/wohnimmobilien/eigentumsfinanzierung-bw-z-15-darlehen.html",
    "/produkte/wohnimmobilien/finanzierung-familienzuwachs.html",
    "/produkte/wirtschaftsfoerderung/wohnen-mit-kind.html",
    "/produkte/wirtschaftsfoerderung/kombi-darlehen-wohnen.html"
  ]);

  isProgramUrl(url: URL) { return this.supportedPrograms.has(url.pathname.toLowerCase()); }
}
