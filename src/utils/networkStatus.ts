class NetworkMonitor {
  private isOnline = navigator.onLine;
  private listeners = new Set<(online: boolean) => void>();
  
  constructor() {
    window.addEventListener('online', this.updateStatus);
    window.addEventListener('offline', this.updateStatus);
  }
  
  private updateStatus = () => {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (wasOnline !== this.isOnline) {
      this.notifyListeners();
    }
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }
  
  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  getStatus() {
    return this.isOnline;
  }
}

export const networkMonitor = new NetworkMonitor(); 