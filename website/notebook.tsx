/*!
   Copyright 2018 Propel http://propel.site/.  All rights reserved.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { h, Component } from "preact";
import { Cell } from "./cell";
import { OutputHandlerDOM } from "../src/output_handler";
import { randomString, delay } from "../src/util";
import { VM } from "./vm";
import { Avatar } from "./common";
import * as db from "./db";

export interface CellData {
  code: string;
  outputDiv: JSX.Element;
  outputRef: Element;
  outputHandler: OutputHandlerDOM;
  status: null | "running" | "updating";
}

export interface NotebookProps {
  save?: (doc: db.NotebookDoc) => void;
  initialDoc?: db.NotebookDoc;
  userInfo?: db.UserInfo; // Info about currently logged in user. 
  onClone?: () => void;
}

export interface NotebookState {
  cells: Map<string, CellData>;
  order: string[];
  active: string;
  cloningInProgress: boolean;

  editingTitle: boolean;
  title: string;
}

export class Notebook extends Component<NotebookProps, NotebookState> {
  state = {
    cells: new Map<string, CellData>(),
    order: [],
    active: null,
    cloningInProgress: false,
    editingTitle: false,
    title: ""
  };
  vm: VM = new VM(this);
  
  // RPC handlers
  plot = (cellId: string, data: any): any => {
    if (!this.state.cells.has(cellId)) return;
    const cell = this.state.cells.get(cellId)
    cell.outputHandler.plot(data);
  }

  print = (cellId: string, data: any): any => {
    if (!this.state.cells.has(cellId)) return;
    const cell = this.state.cells.get(cellId)
    cell.outputHandler.print(data);
  }

  imshow = (cellId: string, data: any): any => {
    if (!this.state.cells.has(cellId)) return;
    const cell = this.state.cells.get(cellId)
    cell.outputHandler.imshow(data);
  }

  downloadProgress = (cellId: string, data: any): any => {
    if (!this.state.cells.has(cellId)) return;
    const cell = this.state.cells.get(cellId)
    cell.outputHandler.downloadProgress(data);
  }

  clearOutput(cellId: string) {
    this.state.cells.get(cellId).outputRef.innerHTML = "";
  }

  componentDidMount() {
    this.insertCell(0, "// New notebook. Insert code here.");
  }

  private insertCell(position: number, code = "", outputHTML?: string) {
    this.setState(state => {
      const id = randomString();
      const cell: CellData = {
        code,
        outputDiv: null,
        outputRef: null,
        outputHandler: null,
        status: null
      };

      const outputDivAttr = {
        "class": "output",
        "id": "output-" + id,
        "ref": (ref => {
          cell.outputRef = ref;
          cell.outputHandler = new OutputHandlerDOM(ref);
        })
      };
      cell.outputDiv = <div { ...outputDivAttr } />;

      state.cells.set(id, cell);
      state.order.splice(position, 0, id);
      return state;
    });
  }
  
  onInsertCellClicked(cell: string) {
    const pos = this.state.order.indexOf(cell);
    this.insertCell(pos + 1, "");
  }

  onDeleteClicked(cell: string) {
    this.setState(state => {
      const pos = this.state.order.indexOf(cell);
      state.cells.delete(cell);
      state.order.splice(pos, 1);
      return state;
    });
  }

  onChange(cell: string, newCode: string) {
    this.setState(state => {
      state.cells.set(cell, {
        ...state.cells.get(cell),
        code: newCode
      });
      return state;
    });
  }

  updateStatus(cellId: string, status) {
    this.setState(s => {
      const cells = new Map(s.cells);
      cells.set(cellId, {
        ...s.cells.get(cellId),
        status
      });
      return { cells };
    });
  }

  async onRun(cell: string) {
    this.clearOutput(cell);
    this.updateStatus(cell, "running");
    await this.vm.exec(this.state.cells.get(cell).code, cell);
    this.updateStatus(cell, "updating");
    await delay(100);
    this.updateStatus(cell, null);
  }

  onFocus(cell: string) {
    const active = this.state.active;
    if (active === cell) return;
    this.goTo(cell);
  }

  onBlur(cell: string) {
    const active = this.state.active;
    if (active !== cell) return;
    this.goTo(null);
  }

  goTo(cell: string) {
    this.setState({ active: cell });
  }

  onClone() {
    if (this.props.onClone) this.props.onClone();
  }

  save() {
    if (!this.props.save) return;
    const cells = [];
    for (const key of this.state.order) {
      cells.push(this.state.cells.get(key).code);
    }
    const doc = {
      ...this.props.initialDoc,
      cells,
      title: this.state.title,
      created: new Date()
    };
    this.props.save(doc);
  }

  handleTitleChange(event) {
    this.setState({ title: event.currentTarget.value });
  }

  renderCells() {
    const { active, cells, order} = this.state;
    return order.map(id => {
      const cell = cells.get(id);
      return (
        <Cell
          key={ id }
          id={ id }
          code={ cell.code }
          outputDiv={ cell.outputDiv }
          focused={ active === id }
          status={ cell.status }

          onDelete={ this.onDeleteClicked.bind(this, id) }
          onInsertCell={ this.onInsertCellClicked.bind(this, id) }
          onRun={ this.onRun.bind(this, id) }
          onFocus={ this.onFocus.bind(this, id) }
          onBlur={ this.onBlur.bind(this, id) }
          goTo={ this.goTo.bind(this) }
        />
      );
    });
  }

  render() {
    const { title, editingTitle } = this.state;
    const { initialDoc, userInfo } = this.props;
    const titleEdit = (
      <div class="title">
        <input
          class="title-input"
          onChange={ this.handleTitleChange.bind(this) }
          value={ title } />
        <button
          class="save-title green-button"
          onClick={ () => this.save() } >
          Save
        </button>
        <button
          class="cancel-edit-title"
          onClick={ () => this.setState({ editingTitle: false }) } >
          Cancel
        </button>
      </div>
    );

    const editButton = (
      <button
        class="edit-title"
        onClick={ () => this.setState({ editingTitle: true }) } >
        Edit
      </button>
    );

    const titleDisplay = (
      <div class="title">
        <h2
          class={ title && title.length ? "" : "untitled" }
          value={ title } >
          { title || "Untitled Notebook" }
        </h2>
        { db.ownsDoc(userInfo, initialDoc) ? editButton : null }
      </div>
    );

    const cloneButton = this.props.userInfo == null ? "" : (
      <button
        class="green-button"
        onClick={ () => this.onClone() } >
        Clone
      </button>
    );

    return (
      <div class="notebook-container">
        <UserTitle userInfo={ initialDoc.owner } />
        <div class="notebook-header">
          { editingTitle ? titleEdit : titleDisplay }
          { cloneButton }
        </div>
        { this.renderCells() }
      </div>
    );
  }
}

function UserTitle(props) {
  return (
    <div class="most-recent-header-title">
      <Avatar userInfo={ props.userInfo } />
      <h2>{ profileLink(props.userInfo) }</h2>
    </div>
  );
}

function profileLink(u: db.UserInfo, text: string = null): JSX.Element {
  const href = window.location.origin + "/notebook/?profile=" + u.uid;
  return (
    <a class="profile-link" href={ href } >
      { text ? text : u.displayName }
    </a>
  );
}
