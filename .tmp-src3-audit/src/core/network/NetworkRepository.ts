export interface NetworkStatus {
  isConnected: boolean | undefined;
  isInternetReachable: boolean | undefined;
}

export interface NetworkRepository {
  getStatus(): Promise<NetworkStatus>;
  isOnline(): Promise<boolean | undefined>;
}

/** Dependency-free fallback. Native adapters can later use expo-network. */
export class RuntimeNetworkRepository implements NetworkRepository {
  async getStatus(): Promise<NetworkStatus> {
    const online = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : undefined;
    return { isConnected: online, isInternetReachable: online };
  }

  async isOnline() {
    return (await this.getStatus()).isInternetReachable;
  }
}

export const networkRepository: NetworkRepository = new RuntimeNetworkRepository();
