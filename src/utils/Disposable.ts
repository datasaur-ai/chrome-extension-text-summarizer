export interface IDisposable {
  dispose(): void;
}

export abstract class Disposable implements IDisposable {
  private disposed = false;
  private readonly disposables: IDisposable[] = [];

  protected _register<T extends IDisposable>(disposable: T): T {
    if (this.disposed) {
      disposable.dispose();
      return disposable;
    }
    this.disposables.push(disposable);
    return disposable;
  }

  public dispose(): void {
    if (this.disposed) return;
    
    this.disposed = true;
    this.disposables.forEach(d => d.dispose());
    this.disposables.length = 0;
  }
}