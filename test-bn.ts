import { BlockNoteEditor } from '@blocknote/core';
const e = BlockNoteEditor.create();
async function run() {
  const blocks = [
    {
      type: 'checkListItem',
      content: 'Test unchecked',
      props: { checked: false }
    },
    {
      type: 'checkListItem',
      content: 'Test checked',
      props: { checked: true }
    }
  ];
  const md = await e.blocksToMarkdownLossy(blocks as any);
  console.log('MARKDOWN OUTPUT:');
  console.log(JSON.stringify(md));
}
run();
