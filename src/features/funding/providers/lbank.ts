import { OfficialWebProvider } from "./web-provider";

export class LBankProvider extends OfficialWebProvider {
  id = "lbank";
  name = "L-Bank";
  allowedHost = "www.l-bank.de";
  catalogUrls = ["https://www.l-bank.de/produkte?query=&facetFilter=%7B%22zielgruppe%22%3A%5B%22Privatpersonen%22%5D%2C%22thema%22%3A%5B%22Bauen+und+Wohnen%22%5D%7D"];
  isProgramUrl(url: URL) { return /^\/produkte\/(wohnimmobilien|wirtschaftsfoerderung)\/[a-z0-9-]+\.html$/i.test(url.pathname); }
}
