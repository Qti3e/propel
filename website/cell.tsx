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
import { CodeMirrorComponent } from "./codemirror";
import { VM, createRPCHandler } from "./vm";
import { delay } from "../src/util";
import { OutputHandlerDOM } from "../src/output_handler";

export interface CellProps {
  onDelete?: () => void;
  onInsertCell?: () => void;
  onRun?: () => void;
  onChange?: (code: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  goTo?: (id: number | string, force?: boolean) => void;
  id?: number | string;

  focused?: boolean;
  status?: null | "running" | "updating";

  code: string;
  outputDiv: JSX.Element;
}

export class Cell extends Component<CellProps, {}> {
  cm: CodeMirrorComponent;

  clickedRun() {
    if (this.props.onRun) this.props.onRun();
  }

  clickedDelete() {
    if (this.props.onDelete) this.props.onDelete();
  }

  clickedInsertCell() {
    if (this.props.onInsertCell) this.props.onInsertCell();
  }

  codeChanged(code: string) {
    if (this.props.onChange) this.props.onChange(code);
  }

  onFocus() {
    if (this.props.onFocus) this.props.onFocus();
  }

  onBlur() {
    if (this.props.onBlur) this.props.onBlur();
  }

  async run() {
    if (this.props.onRun) await this.props.onRun();
  }

  onChange(code: string) {
    if (this.props.onChange) this.props.onChange(code);
  }

  focusNext() {
    if (!this.props.goTo || typeof this.props.id !== "number") return;
    this.props.goTo(this.props.id + 1);
  }

  runCellAndFocusNext() {
    this.run();
    this.focusNext();
  }

  focus() {
    this.cm.focus();
  }

  blur() {
    this.cm.blur();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.focused !== this.props.focused) {
      if (nextProps.focused) this.focus();
      else this.blur();
    }
    // TODO
    return true;
  }

  render() {
    const runButton = (
      <button class="run-button" onClick={ this.clickedRun.bind(this) } />
    );

    let deleteButton = null;
    if (this.props.onDelete) {
      deleteButton = (
        <button
          class="delete-button"
          onClick={ this.clickedDelete.bind(this) } />
      );
    }

    let insertButton = null;
    if (this.props.onInsertCell) {
      insertButton = (
        <button
          class="insert-button"
          onClick={ this.clickedInsertCell.bind(this) } />
      );
    }

    const { id, outputDiv, code, status, focused} = this.props;
    const inputClass = [ "input" ];
    if (status) {
      inputClass.push("notebook-cell-" + status);
    }

    return (
      <div
        class={ "notebook-cell" + (focused ? "notebook-cell-focused" : "")}
        id={ `cell${id}` } >
        <div
          class={ inputClass.join(" ") } >
          <CodeMirrorComponent
            code={ code }
            ref={ ref => { this.cm = ref; } }
            onFocus={ this.onFocus.bind(this) }
            onBlur={ this.onBlur.bind(this) }
            onChange={ this.onChange.bind(this) }
            onAltEnter={ this.runCellAndFocusNext.bind(this) }
            onShiftEnter={ this.runCellAndFocusNext.bind(this) }
            onCtrlEnter={ () => { this.run(); } }
          />
          { deleteButton }
          { runButton }
        </div>
        <div class="progress-bar" />
        <div class="output-container">
          { outputDiv }
          { insertButton }
        </div>
      </div>
    );
  }
}

// All codes below are for doc's cell.

let nextCellId: number = 0;
 
const prerenderedOutputs = new Map<number, string>();

export function registerPrerenderedOutput(output) {
  const cellId = Number(output.id.replace("output", ""));
  prerenderedOutputs.set(cellId, output.innerHTML);
}

const cellExecuteQueue: StandaloneCell[] = [];

export async function drainExecuteQueue() {
  while (cellExecuteQueue.length > 0) {
    const cell = cellExecuteQueue.shift();
    await cell.run();
  }
}

interface SCellProps {
  code: string;
  vm?: VM;
}

interface SCellState {
  code: string;
  focused: boolean;
  status: null | "running" | "updating";
}

export class StandaloneCell extends Component<SCellProps, SCellState> {
  readonly id: number;
  outputDiv: JSX.Element;
  output: Element;
  outputHTML?: string;
  outputHandler: OutputHandlerDOM;
  vm: VM;
  destroyVM: boolean;

  constructor(props) {
    super(props);
    this.id = nextCellId++;
    this.state = {
      code: props.code,
      focused: false,
      status: null
    };
    if (prerenderedOutputs.has(this.id)) {
      this.outputHTML = prerenderedOutputs.get(this.id);
    }
    if (this.props.vm) this.vm = this.props.vm;
  }

  componentWillMount() {
    if (this.outputHTML === null) {
      cellExecuteQueue.push(this);
    }
  }

  componentWillUnMount() {
    if (this.destroyVM) {
      this.vm.destroy();
      this.vm = null;
    }
  }

  handleCodeChange(newCode: string) {
    this.setState({ code: newCode });
  }

  toggleFocus(focused: boolean) {
    this.setState({ focused });
  }

  clearOutput() {
    this.output.innerHTML = "";
  }

  async run() {
    this.clearOutput();
    this.setState({ status: "running" });
    // TODO(@qti3e) I think it's better to wrap code in a function.
    // to prevent possible bugs with having duplicate var names in
    // docs.
    await this.vm.exec(this.state.code, this.id);
    this.setState({ status: "updating" });
    await delay(100);
    this.setState({ status: null });
  }

  initOutputDiv() {
    if (this.outputDiv) return;
    // If supplied outputHTML, use that in the output div.
    const outputDivAttr = {
      "class": "output",
      "id": "output" + this.id,
      "ref": (ref => {
        this.output = ref;
        this.outputHandler = new OutputHandlerDOM(ref);
        if (!this.vm) {
          const rpcHandler = createRPCHandler(this.outputHandler);
          this.vm = new VM(rpcHandler);
          this.destroyVM = true;
        }
      }),
    };
    if (this.outputHTML) {
      outputDivAttr["dangerouslySetInnerHTML"] = {
        __html: this.outputHTML,
      };
    }
    this.outputDiv = <div { ...outputDivAttr } />;
  }

  render() {
    this.initOutputDiv();

    return (
      <Cell
        id={ this.id }
        code={ this.state.code }
        onChange={ this.handleCodeChange.bind(this) }
        outputDiv={ this.outputDiv }
        onFocus={ () => this.toggleFocus(true) }
        onBlur={ () => this.toggleFocus(false) }
        focused={ this.state.focused }
        onRun={ this.run.bind(this) }
        status={ this.state.status }
      />
    );
  }
}

export function resetCells() {
  nextCellId = 0;
  prerenderedOutputs.clear();
}
