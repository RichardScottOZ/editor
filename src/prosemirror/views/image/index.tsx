/* eslint-disable max-classes-per-file */
import React from 'react';
import { render } from 'react-dom';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { opts } from '../../../connect';
import ImageEditor from './ImageEditor';
import { updateNodeAttrsOnView } from '../../utils';
import { AlignOptions } from './ImageToolbar';
import { isEditable } from '../../plugins/editable';

class ImageView {
  // The node's representation in the editor (empty, for now)
  dom: HTMLElement;

  node: Node;

  view: EditorView;

  editor: null | ImageEditor = null;

  currentSrc: string;

  getPos: (() => number);

  constructor(node: Node, view: EditorView, getPos: (() => number)) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement('div');
    const viewId = this.view.dom.id;
    const {
      src, alt, title, align, width,
    } = node.attrs;
    this.currentSrc = src;

    const onAlign = (value: AlignOptions) => (
      updateNodeAttrsOnView(
        this.view,
        { node: this.node, pos: this.getPos() }, { align: value },
      )
    );

    const onWidth = (value: number) => (
      updateNodeAttrsOnView(
        this.view,
        { node: this.node, pos: this.getPos() }, { width: value },
      )
    );

    const onDelete = () => {
      const tr = this.view.state.tr.delete(this.getPos(), this.getPos() + 1);
      this.view.dispatch(tr);
    };

    render(
      <ImageEditor {...{ onAlign, onWidth, onDelete }} ref={(r) => { this.editor = r; }} />,
      this.dom,
      async () => {
        const url = await opts.image.downloadUrl(src);
        this.editor?.setState({
          viewId, src: url, alt, title, align, width,
        });
      },
    );
  }

  selectNode() {
    const viewId = this.view.dom.id;
    const edit = isEditable(this.view.state);
    this.editor?.setState({ open: this.view.hasFocus(), edit, viewId });
  }

  deselectNode() {
    const edit = isEditable(this.view.state);
    this.editor?.setState({ open: false, edit });
  }

  update(node: Node) {
    if (!node.sameMarkup(this.node)) return false;
    this.node = node;
    const edit = isEditable(this.view.state);
    const {
      src, align, alt, title, width,
    } = node.attrs;
    if (src !== this.currentSrc) {
      // eslint-disable-next-line no-console
      console.log('Source change?');
    }
    this.editor?.setState({
      edit, align, alt, title, width,
    });
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    // TODO: Delete the actual image that was uploaded?
  }
}

export default ImageView;
