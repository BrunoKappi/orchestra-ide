declare module 'bpmn-js/lib/Modeler' {
  export default class BpmnModeler {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: Array<any> }>;
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
    saveSVG(options?: any): Promise<{ svg: string }>;
    get(service: string): any;
    on(event: string, callback: (e: any) => void): void;
    off(event: string, callback: (e: any) => void): void;
    destroy(): void;
  }
}

declare module 'bpmn-js' {
  import Modeler from 'bpmn-js/lib/Modeler';
  export default Modeler;
}
