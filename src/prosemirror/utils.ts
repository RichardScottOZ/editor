import { NodeSpec } from 'prosemirror-model';
import { EditorState, NodeSelection } from 'prosemirror-state';
import { ContentNodeWithPos, isNodeSelection } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

export const TEST_LINK = /((https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))$/;
export const TEST_LINK_SPACE = /((https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))\s$/;
export const TEST_LINK_COMMON_SPACE = /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[com|org|app|dev|io|net|gov|edu]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))\s$/;

const testLink = (possibleLink: string) => {
  const match = TEST_LINK.exec(possibleLink);
  return Boolean(match);
};

export const addLink = (view: EditorView, data: DataTransfer | null) => {
  const href = data?.getData('text/plain') ?? '';
  if (!testLink(href)) return false;
  const { schema } = view.state;
  const node = schema.text(href, [schema.marks.link.create({ href })]);
  const tr = view.state.tr
    .replaceSelectionWith(node, false)
    .scrollIntoView();
  view.dispatch(tr);
  return true;
};

export function updateNodeAttrsOnView(
  view: EditorView | null, node: Pick<ContentNodeWithPos, 'node' | 'pos'>, attrs: { [index: string]: any },
) {
  if (view == null) return;
  const tr = view.state.tr.setNodeMarkup(
    node.pos,
    undefined,
    { ...node.node.attrs, ...attrs },
  );
  tr.setSelection(NodeSelection.create(tr.doc, node.pos));
  view.dispatch(tr);
}


// https://discuss.prosemirror.net/t/expanding-the-selection-to-the-active-mark/478
function getLinkBounds(state: EditorState, pos: number) {
  const $pos = state.doc.resolve(pos);

  const { parent, parentOffset } = $pos;
  const start = parent.childAfter(parentOffset);
  if (!start.node) return null;

  const link = start.node.marks.find((mark) => mark.type === state.schema.marks.link);
  if (!link) return null;

  let startIndex = $pos.index();
  let startPos = $pos.start() + start.offset;
  let endIndex = startIndex + 1;
  let endPos = startPos + start.node.nodeSize;
  while (startIndex > 0 && link.isInSet(parent.child(startIndex - 1).marks)) {
    startIndex -= 1;
    startPos -= parent.child(startIndex).nodeSize;
  }
  while (endIndex < parent.childCount && link.isInSet(parent.child(endIndex).marks)) {
    endPos += parent.child(endIndex).nodeSize;
    endIndex += 1;
  }
  return { from: startPos, to: endPos, link };
}


export function getLinkBoundsIfTheyExist(state: EditorState) {
  const {
    from, $from, to, $to, empty,
  } = state.selection;
  const mark = state.schema.marks.link;
  const searchForLink = empty
    ? Boolean(mark.isInSet(state.storedMarks || $from.marks()))
    : state.doc.rangeHasMark(from, to, mark);

  const linkBounds = searchForLink ? getLinkBounds(state, from) : null;

  const hasLink = Boolean(
    (mark.isInSet($from.marks()) || from === linkBounds?.from)
    && (mark.isInSet($to.marks()) || to === linkBounds?.to),
  );

  if (!hasLink || !linkBounds) return null;
  return linkBounds;
}


export function getNodeIfSelected(state: EditorState, spec: NodeSpec) {
  const selected = isNodeSelection(state.selection);
  const { node } = (state.selection as NodeSelection);
  if (selected && node?.type.name === spec.name) {
    return node;
  }
  return null;
}
