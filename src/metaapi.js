import axios from "axios";
const BASE = "https://api.metaapi.cloud";
const headers = () => ({ Authorization: `Bearer ${process.env.METAAPI_TOKEN}` });

// 1) Créer le compte MetaApi du client
export async function createMetaApiAccount({ login, password, server }) {
  const { data } = await axios.post(`${BASE}/users/current/accounts`, {
    name: `client-${login}`, type: "cloud", login, password, server, platform: "mt5"
  }, { headers: headers() });
  return data; // { id: accountId, ... }
}

// 2) Abonner le compte client à TA stratégie CopyFactory
export async function attachSubscriberToStrategy({ subscriberAccountId, settings }) {
  await axios.post(`${BASE}/copyfactory/v1/subscribers`, {
    accountId: subscriberAccountId,
    subscriptions: [{ strategyId: process.env.COPYFACTORY_STRATEGY_ID, multiplier: settings.multiplier }],
    riskLimits: { maxPositionSize: settings.maxLot, dailyEquityRiskLimit: settings.maxDailyDD }
  }, { headers: headers() });
}
