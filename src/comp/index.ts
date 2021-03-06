// comp.js

export enum TagRenderMode {
  normal,
  selfClosing,
  startTag
}

export interface IComp {
  parent: IComp;
  _toHtml(): string;
}

export interface IHtmlOptions {
  tagName: string;
  attributes: any;
  classNames: IClassNames;
  children: any[];
  renderMode?: TagRenderMode;
}

export type IClassNames = string | string[] | { [key: string]: boolean }

export class Literal implements IComp {
  parent: IComp;
  literal: string;

  constructor(literal: string) {
    this.literal = literal;
  }

  _toHtml() {
    return this.literal;
  }
}

export class Comp<T> implements IComp {
  id: string;
  options: T;

  tagName: string;
  attributes: any;
  classNames: string[];
  children: IComp[];
  content: string;
  parent: IComp;
  registrations: { type: string, listener: EventListener, useCapture?: boolean }[];
  renderMode: TagRenderMode;

  constructor(options: T) {
    this.id = this._generateId(8);
    this.options = options;
    this.init();
  }

  _generateId(length: number) {
    const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const chars = [];
    for (let i = 0; i < length; i += 1) {
      chars.push(base62Chars[Math.floor(Math.random() * 62)]);
    }
    return chars.join('');
  }

  appendChild(child: IComp) {
    child.parent = this;
    if (!this.children) {
      this.children = [];
    }
    this.children.push(child);
    return this;
  }

  compose(tagName: string, attributes: any, classNames: IClassNames, ...children: any[]) {
    this.tagName = tagName;
    this.attributes = attributes;
    if (typeof classNames === 'string') {
      this.classNames = classNames.split(' ');
    } else { // typeof classNames === 'object'
      if (classNames instanceof Array) {
        this.classNames = classNames;
      } else {
        this.classNames = Object.keys(classNames).filter(key => classNames[key]);
      }
    }
    if (children.length === 1 && typeof children[0] === 'string') {
      this.content = children[0];
    } else {
      this.children = children;
      this.children.forEach(child => child.parent = this);
    }
    return this;
  }

  init() {
    this.tagName = 'div';
    this.attributes = {}
    this.classNames = [];
    this.children = [];
    this.registrations = [];
  }

  _toHtml() {
    const _attr = (attr: any) => Object.keys(attr)
      .filter(key => attr[key] !== undefined)
      .map(key => attr[key] !== null ? `${key}="${attr[key]}"` : key)
      .join(' ');

    if (this.renderMode === TagRenderMode.selfClosing) {
      return `<${this.tagName} comp-id="${this.id}" class="${this.classNames.join(' ')}" ${_attr(this.attributes)} />`;
    }

    if (this.renderMode === TagRenderMode.startTag) {
      return `<${this.tagName}>`;
    }

    const content = this.content || this.children.map(child => child._toHtml()).join('');

    return `<${this.tagName} comp-id="${this.id}" class="${this.classNames.join(' ')}" ${_attr(this.attributes)}>${content}</${this.tagName}>`;
  }

  _doRegistrations() {
    this.registrations.forEach(({ type, listener, useCapture }) => this._element().addEventListener(type, listener, useCapture));
  }

  _element() {
    return document.querySelector(`[comp-id=${this.id}]`);
  }

  update(options: any) {
    Object.assign(this.options, options);
    this.init();

    const old = this._element();
    old.insertAdjacentHTML('beforebegin', this._toHtml());
    old.remove();

    this._doRegistrations();

    return this;
  }

  register(type: string, listener: EventListener, useCapture = false) {
    this.registrations.push({ type, listener, useCapture });
    return this;
  }

  renderTo(selector: string) {
    document.querySelector(selector).innerHTML = this._toHtml();
    this._doRegistrations();
  }
}

export class SystemComp extends Comp<IHtmlOptions> {
  init() {
    super.init();
    this.compose(
      this.options.tagName,
      this.options.attributes,
      this.options.classNames,
      ...this.options.children
    );
    this.options.renderMode && (this.renderMode = this.options.renderMode);
  }
}

export function element(tagName: string, attributes: any, classNames: IClassNames, ...children: any[]) {
  return new SystemComp({
    tagName,
    attributes,
    classNames,
    children,
    renderMode: TagRenderMode.normal
  });
}

export function selfClosingElement(tagName: string, attributes: any, classNames: IClassNames) {
  return new SystemComp({
    tagName,
    attributes,
    classNames,
    children: [],
    renderMode: TagRenderMode.selfClosing
  });
}

function generateContainerFactory(tagName: string) {
  return (attributes: any, classNames: IClassNames, ...children: any[]) =>
    element(tagName, attributes, classNames, ...children);
}

function generateLeafFactory(tagName: string) {
  return (attributes: any, classNames: IClassNames) =>
    selfClosingElement(tagName, attributes, classNames);
}

function generateMinimalLeafFactory(tagName: string) {
  return () => new Literal(`<${tagName}>`);
}

export const div = generateContainerFactory('div');
export const main = generateContainerFactory('main');
export const section = generateContainerFactory('section');
export const article = generateContainerFactory('article');
export const header = generateContainerFactory('header');
export const footer = generateContainerFactory('footer');
export const aside = generateContainerFactory('aside');
export const nav = generateContainerFactory('nav');
export const details = generateContainerFactory('details');
export const summary = generateContainerFactory('summary');

export const span = generateContainerFactory('span');
export const a = generateContainerFactory('a');

export const ul = generateContainerFactory('ul');
export const ol = generateContainerFactory('ol');
export const li = generateContainerFactory('li');

export const h1 = generateContainerFactory('h1');
export const h2 = generateContainerFactory('h2');
export const h3 = generateContainerFactory('h3');
export const h4 = generateContainerFactory('h4');
export const h5 = generateContainerFactory('h5');
export const h6 = generateContainerFactory('h6');

export const form = generateContainerFactory('form');
export const label = generateContainerFactory('label');
export const canvas = generateContainerFactory('canvas');
export const blockquote = generateContainerFactory('blockquote');
export const code = generateContainerFactory('code');
export const pre = generateContainerFactory('pre');

export const button = generateContainerFactory('button');
export const textarea = generateContainerFactory('textarea');
export const select = generateContainerFactory('select');
export const option = generateContainerFactory('option');

export const table = generateContainerFactory('table');
export const thead = generateContainerFactory('thead');
export const tbody = generateContainerFactory('tbody');
export const colgroup = generateContainerFactory('colgroup');
export const col = generateContainerFactory('col');
export const tr = generateContainerFactory('tr');
export const th = generateContainerFactory('th');
export const td = generateContainerFactory('td');

export const input = generateLeafFactory('input');
export const img = generateLeafFactory('img');
export const br = generateMinimalLeafFactory('br');
export const hr = generateMinimalLeafFactory('hr');

export class UserComp<T> extends Comp<T> {
  init() {
    super.init();
    this.tagName = 'div';
    this.renderMode = TagRenderMode.normal;
  }
}

export class BuiltinComp<T> extends Comp<T> {
  init() {
    super.init();
    this.tagName = 'div';
    this.renderMode = TagRenderMode.normal;
  }
}

export class If extends BuiltinComp<{ if: boolean, then: IComp, else: IComp }> {
  init() {
    super.init();
    this.attributes['comp-if'] = null;
    this.children.push(this.options.if ? this.options.then : this.options.else);
  }
}

export class For<T> extends BuiltinComp<{ data: T[], mapper: (item: T) => IComp }> {
  init() {
    super.init();
    this.attributes['comp-for'] = null;
    this.options.data.forEach(item => this.children.push(this.options.mapper(item)));
  }
}

export class Select<T> extends BuiltinComp<{ data: T[], name: string, labelMapper: (item: T) => string, valueMapper: (item: T) => string, useRadio: boolean }> {
  init() {
    super.init();
    if (this.options.useRadio) {
      this.compose('div', {}, [],
        ...this.options.data.map((item, index) => div({}, [],
          input({ type: 'radio', id: `${this.id}-option-${index}`, name, value: this.options.valueMapper(item) }, []),
          label({ for: `${this.id}-option-${index}` }, [], this.options.labelMapper(item)))
        )
      );
    } else {
      this.compose('select', { name }, [],
        ...this.options.data.map((item, index) => option({ value: this.options.valueMapper(item) }, [], this.options.labelMapper(item)))
      );
    }
  }
}

export class RouterPage extends BuiltinComp<{ params: string[] }> {
  init() {
    super.init();
    this.attributes['comp-page'] = null;
  }
}

export class RouterOutlet extends BuiltinComp<{ routes: { path: string, comp: IComp }[] }> {
  init() {
    super.init();
    this.attributes['comp-outlet'] = null;
  }
}

export class RouterLink extends BuiltinComp<{ href: string }> {
  init() {
    super.init();
    this.attributes['comp-link'] = null;
  }
}

export class Test extends UserComp<any> {
  init() {
    super.init();
    this.compose('div', {}, [],
      span({}, [], this.options.title),
      span({}, [], this.options.description)
    );
  }
}

export class Rating extends UserComp<{ name: string, rating: number }> {
  init() {
    super.init();

    const dataValue = 'data-value';
    const symbol0 = '\u2606';
    const symbol1 = '\u2605';

    this.compose('span', {}, [],
      ...[0, 1, 2, 3, 4].map(i =>
        span({ [dataValue]: i + 1 }, ['rating-star'], this.options.rating > i ? symbol1 : symbol0))
    ).register('click', e => {
      const rating = parseInt((<Element>e.target).getAttribute(dataValue))
      this.update({ rating });
    });
  }
}
