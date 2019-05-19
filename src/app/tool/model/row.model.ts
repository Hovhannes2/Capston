
export class Group {
  public rows: Array<Row>;

  constructor(rows?: Array<Row>) {
    this.rows = rows ? rows : [];
  }

}

export class Row {
  id: number;
  type: string;
  desc: string;
  navigations: number;
  tasks: number;
  importance: number;

  constructor(id?: number, type?: string, desc?: string, navigations?: number, tasks?: number, importance?: number) {
    this.id = id;
    this.type = type;
    this.desc = desc;
    this.navigations = navigations;
    this.tasks = tasks;
    this.importance = importance;
  }

}
