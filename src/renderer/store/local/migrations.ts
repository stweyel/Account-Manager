import ElectronStore from 'electron-store';
import {Dict, LocalStore, ManagedNode} from '@renderer/types';

const deleteSocketsAndUpdatePorts = (localStore: ElectronStore<LocalStore>) => {
  // Remove `sockets` data, as it was never used
  localStore.delete('sockets' as any);

  // "port" is now required
  const addPortToManagedNodes = (managedNodes: Dict<ManagedNode>): Dict<ManagedNode> => {
    const updatedNodes: Dict<ManagedNode> = {};
    for (const [address, managedNode] of Object.entries(managedNodes)) {
      const hasPortInAddress = address.split('').filter((char) => char === ':').length === 2;
      const updatedAddress = hasPortInAddress ? address : `${address}:80`;

      updatedNodes[updatedAddress] = {
        ...managedNode,
        port: managedNode.port === null ? 80 : managedNode.port,
      };
    }
    return updatedNodes;
  };

  const managedBanks = localStore.get('managed_banks');
  const updatedManagedBanks = addPortToManagedNodes(managedBanks);
  localStore.set('managed_banks', updatedManagedBanks);

  const managedValidators = localStore.get('managed_validators');
  const updatedManagedValidators = addPortToManagedNodes(managedValidators);
  localStore.set('managed_validators', updatedManagedValidators);
};

const migrations: any = {
  0: deleteSocketsAndUpdatePorts,
};

export const runMigrations = (localStore: ElectronStore<LocalStore>): void => {
  const migrationIds = Object.keys(migrations).map((i) => Number(i));
  const lastRanMigrationId = localStore.get('version');
  const latestAvailableMigrationId = Math.max(...migrationIds);

  // Brand new install
  if (lastRanMigrationId === undefined) {
    localStore.set('version', latestAvailableMigrationId);
    return;
  }

  // Already up to date
  if (lastRanMigrationId === latestAvailableMigrationId) {
    return;
  }

  const migrationIdsToRun = migrationIds
    .filter((migrationId) => migrationId > lastRanMigrationId)
    .sort((a, b) => a - b);

  for (const migrationId of migrationIdsToRun) {
    try {
      migrations[migrationId]();
      localStore.set('version', migrationId);
    } catch (error) {
      console.error(error);
    }
  }
};
