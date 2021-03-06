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
// tslint:disable:variable-name
// This is the propelml.org website. It is used both server-side and
// client-side for generating HTML.
import { readFileSync } from "fs";
import { Component, h, render } from "preact";
import { Footer, GlobalHeader, UserMenu } from "./common";
import * as db from "./db";
import { Docs } from "./docs";
import * as nb from "./nb";
const { version } = require("../package.json");

export interface Page {
  title: string;
  path: string;
  root: any;
  route: RegExp;
}

export function renderPage(p: Page): void {
  render(h(p.root, null), document.body, document.body.children[0]);
}

function headerButton(href, text) {
  return <a class="button header-button" href={ href }>{ text }</a>;
}

function fixed(code: string): JSX.Element {
  return h(nb.FixedCell, { code });
}

export const References = (props) => {
  const refhtml = readFileSync(__dirname + "/references.html", "utf8");
  return (
    <div class="references">
      <GlobalHeader subtitle="References" />
      <p>This work is inspired by and built upon great technologies.</p>
      <div dangerouslySetInnerHTML={ { __html: refhtml } } />
      <Footer />
    </div>
  );
};

export const PropelIndex = (props) => {
  return (
    <div class="index">
      <Splash />
      <Intro />
      <UseIt />
      <Perks />
      <TrainingExample />
      <Footer />
    </div>
  );
};

const Splash = props => (
  <div>
    { false && `TODO "header" should be inside GlobalHeader.` }
    <header>
      <GlobalHeader>
        <a href="/notebook">Notebook</a>
        <UserMenu { ...props } />
      </GlobalHeader>
    </header>
  </div>
);

const Intro = () => (
  <div class="intro flex-row">
    <div class="flex-cell">
      <h2>Differential Programming in JavaScript</h2>
      <p>
        <b>Propel</b> provides a GPU-backed numpy-like infrastructure
        for scientific computing in JavaScript.  JavaScript is a fast,
        dynamic language which, we think, could act as an ideal workflow
        for scientific programmers of all sorts.
      </p>
      <p>
        { headerButton("/docs", "API Ref") }
        { false && `Hide notebook link until more developed.` }
        { false && `headerButton("/notebook", "Notebook"),` }
        { headerButton("http://github.com/propelml/propel", "Github") }
      </p>
    </div>
    <div class="intro-notebook flex-cell">
      { nb.cell(tanhGrads) }
    </div>
  </div>
);

const tanhGrads = `
import { grad, linspace, plot } from "propel";

f = x => x.tanh();
x = linspace(-4, 4, 200);
plot(x, f(x),
     x, grad(f)(x),
     x, grad(grad(f))(x),
     x, grad(grad(grad(f)))(x),
     x, grad(grad(grad(grad(f))))(x))
`;

const UseIt = () => (
  <div class="use-it">
    <div class="use-it-inner">
      <p class="snippit-title">Use it in Node:</p>
      { fixed("npm install propel\nlet pr = require(\"propel\");") }
      <p class="snippit-title">Use it in a browser:</p>
      { fixed(`<script src="https://unpkg.com/propel@${version}"></script>`) }
    </div>
  </div>
);

const Perks = () => (
  <div class="perks">
    <div class="flex-row">
      <div class="flex-cell">
        <h2 class="world">Run anywhere.</h2>
        <p>
          Propel runs both in the browser and natively from Node. In
          both environments Propel is able to use GPU hardware for
          computations.  In the browser it utilizes WebGL through
          <a href="https://deeplearnjs.org/">deeplearn.js</a>
          and on Node it uses TensorFlow's
          <a href="https://www.tensorflow.org/install/install_c">
            C API
          </a>.
        </p>
      </div>
      <div class="flex-cell">
        <h2 class="upward">Phd optional.</h2>
        <p>
          Propel has an imperative
          <a href="https://github.com/HIPS/autograd">autograd</a>
          -style API.  Computation graphs are traced as
          you run them -- a general purpose
          <i>gradient function</i>
          provides an elegant interface to backpropagation.
        </p>
      </div>
    </div>
    <div class="flex-row">
      <div class="flex-cell">
        <h2 class="chip">Did somebody say GPUs?</h2>
        <p>
          Browsers are great for demos, but they are not a great numerics
          platform. WebGL is a far cry from CUDA. By running Propel outside
          of the browser, users will be able to target multiple GPUs and
          make TCP connections. The models developed server-side will be
          much easier to deploy as HTML demos.
        </p>
      </div>
      <div class="flex-cell">
        <h2 class="lightning">Let's do this.</h2>
        <p>
          The basic propel npm package is javascript only,
          without TensorFlow bindings. To upgrade your speed dramatically
          install
        </p>
        { fixed([
            "npm install propel_mac",
            "npm install propel_windows",
            "npm install propel_linux",
            "npm install propel_linux_gpu",
          ].join("\n")) }
      </div>
    </div>
  </div>
);

// TODO Use require instead of import in the trainingExampleCode.
// So people can copy and past the code into the terminal.
const trainingExampleCode = `
import * as pr from "propel"

let exp = await pr.experiment("exp001")
let ds = pr.dataset("iris").batch(150)
                           .repeat(1000)

for (const batch of ds) {
  let { features, labels } = await batch
  exp.sgd({ lr: 0.01 }, (params) =>
    features
    .linear("L1", params, 4).relu()
    .linear("L2", params, 3)
    .softmaxLoss(labels))
  // Delete to train.
  break;
}
`;

const TrainingExample = () => (
  <div class="training-example-inner">
    <div class="training-example-inner">
      <h2>Neural Networks</h2>
      <div class="flex-row">
        <div class="flex-cell">{ nb.cell(trainingExampleCode) }</div>
        <div class="flex-cell">
          <p>
            <b>What are NNs anyway?</b> The terminology is a bit misleading. Any
            number of operations and architectures can be considered a neural
            network. The primary thing in common is that NN models use
            differentiable operations to allow gradient descent to improve their
            fitness.
          </p>
          <p>
            Propel provides a concise API for specifying, training, and
            making inference in neural networks. In the example, a two layer
            fully-connected ReLU network is being trained on the iris dataset.
            Iris is a very small dataset where each training example is only
            4 floating point features. There are three possible labels to apply.
            As with all classification problems, we apply softmaxLoss to the
            labels.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export let firebaseUrls = [
  "https://www.gstatic.com/firebasejs/4.9.0/firebase.js",
  "https://www.gstatic.com/firebasejs/4.9.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/4.9.0/firebase-firestore.js",
];

// Called by tools/build_website.ts
export function getHTML(title, markup) {
  const scriptTags = firebaseUrls.map(u =>
    `<script src="${u}"></script>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <meta id="viewport" name="viewport" content="width=device-width,
      minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <link rel="stylesheet" href="/bundle.css"/>
    ${scriptTags}
    <script src="/main.js"></script>
    <link rel="icon" type="image/png" href="/static/favicon.png">
  </head>
  <body>${markup}
  <script async
    src="https://www.googletagmanager.com/gtag/js?id=UA-112187805-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-112187805-1');
  </script>
  </body>
</html>`;
}

export interface RouterState {
  userInfo?: db.UserInfo;
  loadingAuth: boolean;
}

// The root of all pages of the propel website.
// Handles auth.
export class Router extends Component<any, RouterState> {
  constructor(props)  {
    super(props);
    this.state = {
      userInfo: null,
      loadingAuth: true,
    };
  }

  unsubscribe: db.UnsubscribeCb;
  componentWillMount() {
    this.unsubscribe = db.active.subscribeAuthChange((userInfo) => {
      this.setState({ loadingAuth: false, userInfo });
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    console.log("document.location.pathname", document.location.pathname);
    const page = route(document.location.pathname);
    return h(page.root, { userInfo: this.state.userInfo });
  }
}

export function route(pathname: string): Page {
  for (const page of pages) {
    if (pathname.match(page.route)) {
      return page;
    }
  }
  // TODO 404 page
  return null;
}

export const pages: Page[] = [
  {
    title: "Propel ML",
    path: "index.html",
    root: PropelIndex,
    route: /^\/(index.html)?$/,
  },
  {
    title: "Propel Notebook",
    path: "notebook/index.html",
    root: nb.NotebookRoot,
    route: /^\/notebook/,
  },
  {
    title: "Propel References",
    path: "references/index.html",
    root: References,
    route: /^\/references(.html)?/,
  },
  {
    title: "Propel Docs",
    path: "docs/index.html",
    root: Docs,
    route: /^\/docs/,
  },
];
