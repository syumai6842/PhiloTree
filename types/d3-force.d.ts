declare module 'd3-force' {
  export function forceSimulation(nodes: any[]): any;
  export function forceLink(links: any[]): any;
  export function forceManyBody(): any;
  export function forceCenter(x: number, y: number): any;
  export function forceCollide(): any;
  export function forceY(y: number | ((d: any) => number)): any;
  export function forceX(x: number | ((d: any) => number)): any;
} 