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
import { OutputHandlerDOM } from "../src/output_handler";

export interface CellProps {
  onDelete?: () => void;
  onInsertCell?: () => void;
  onRun?: () => void;
  onChange?: (code: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  goTo?: (id: number, force?: boolean) => void;
  id?: number;
  outputHandler?: OutputHandlerDOM;

  focused?: boolean;
  status?: null | "running" | "updating";

  code: string;
  outputDiv: Element;
}

export class Cell extends Component<CellProps, {}> {
  cm: CodeMirrorComponent;
  private outputHandler: OutputHandlerDOM;

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
    if (this.props.goTo) this.props.goTo(this.props.id);
  }

  blur() {
    this.cm.blur();
    if (!this.props.focused) return;
    if (this.props.goTo) this.props.goTo(null);
  }

  // TODO This should be removed in future.
  getOutputHandler() {
    return this.outputHandler;
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

    const { id, outputDiv, code, status } = this.props;
    const inputClass = [ "input" ];
    if (status) {
      inputClass.push("notebook-cell-" + status);
    }

    return (
      <div
        class="notebook-cell"
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
