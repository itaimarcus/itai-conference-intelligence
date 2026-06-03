"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STORE, loadStore, type StoreShape } from "./clientStore";
import { STORE_CHANGE_EVENT } from "./storageKeys";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORE_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getStoreSnapshot(): StoreShape {
  return loadStore();
}

function getServerStoreSnapshot(): StoreShape {
  return EMPTY_STORE;
}

export type StoreCounts = {
  leads: number;
  contacts: number;
  encounters: number;
};

const EMPTY_COUNTS: StoreCounts = { leads: 0, contacts: 0, encounters: 0 };

let cachedCounts: StoreCounts = EMPTY_COUNTS;
let countsSource: StoreShape | null = null;

function getCountsSnapshot(): StoreCounts {
  const store = loadStore();
  if (store === countsSource) return cachedCounts;
  countsSource = store;

  const leads = store.leads.length;
  const contacts = store.contacts.length;
  const encounters = store.encounters.length;
  if (
    leads === cachedCounts.leads &&
    contacts === cachedCounts.contacts &&
    encounters === cachedCounts.encounters
  ) {
    return cachedCounts;
  }
  cachedCounts = { leads, contacts, encounters };
  return cachedCounts;
}

function getServerCountsSnapshot(): StoreCounts {
  return EMPTY_COUNTS;
}

export function useHydratedStore(): StoreShape {
  return useSyncExternalStore(subscribe, getStoreSnapshot, getServerStoreSnapshot);
}

export function useStoreCounts(): StoreCounts {
  return useSyncExternalStore(
    subscribe,
    getCountsSnapshot,
    getServerCountsSnapshot,
  );
}
