/**
 * ./src/interfaces/i-packages.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface Packages {
  packages: string[]
}

interface IOperation {
  try_remove?: string[];
  try_install?: string[];
}

export interface IPackages {
  backend: string;
  operations: IOperation[];
}