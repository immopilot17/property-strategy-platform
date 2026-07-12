import type { FundingProvider } from "../domain";
import { KfwProvider } from "./kfw";
import { LBankProvider } from "./lbank";

export const fundingProviders: FundingProvider[] = [new KfwProvider(), new LBankProvider()];
