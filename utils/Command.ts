import { ChildProcess, StdioOptions, spawn } from "node:child_process";

export interface CommandOptions {
  cmd: string;
  args: string[];
  stdio?: StdioOptions;
}

export interface CommandStatus {
  ok: boolean;
  code: number;
}

export class Command<Spawned extends boolean = false> {
  private proc?: ChildProcess;
  constructor(public options: CommandOptions) {}

  static async all(...commands: Command<boolean>[]): Promise<CommandStatus[]> {
    return Promise.all(
      commands.map((x) => {
        return x.spawn().status();
      })
    );
  }

  get process(): Spawned extends true
    ? ChildProcess
    : Spawned extends false
    ? undefined
    : never {
    return this.proc as any;
  }

  isSpawned(): this is Command<true> {
    return this.proc !== undefined;
  }

  spawn(): Command<true> {
    if (this.proc) return this as Command<true>;

    this.proc = spawn(this.options.cmd, this.options.args, {
      stdio: this.options.stdio,
      windowsHide: true,
      shell: true,
    });

    return this as Command<true>;
  }

  output(this: Command<true>) {
    const buffers: Buffer[] = [];

    this.process.stdout?.on("data", (data: Buffer) => {
      buffers.push(data);
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      buffers.push(data);
    });

    return new Promise<Buffer[]>((resolve, reject) => {
      this.proc?.on("close", () => {
        resolve(buffers);
      });

      this.proc?.on("error", () => {
        reject();
      });
    });
  }

  status(this: Command<true>) {
    return new Promise<CommandStatus>((resolve, reject) => {
      this.proc?.on("close", (code) => {
        resolve({
          ok: code == 0,
          code: code ?? -1,
        });
      });

      this.proc?.on("error", (err) => {
        reject(err);
      });
    });
  }

  statusWithOutput(this: Command<true>) {
    return Promise.all([this.status(), this.output()]);
  }
}
