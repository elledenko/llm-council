// Build a Markdown export of a conversation with all 3 stages per turn.
export function conversationToMarkdown(conversation) {
  if (!conversation) return '';

  const lines = [];
  const title = conversation.title || 'LLM Council Conversation';
  lines.push(`# ${title}`);
  if (conversation.created_at) {
    lines.push('');
    lines.push(`_Created: ${conversation.created_at}_`);
  }
  lines.push('');

  let turnIdx = 0;
  for (const msg of conversation.messages || []) {
    if (msg.role === 'user') {
      turnIdx += 1;
      lines.push(`---`);
      lines.push('');
      lines.push(`## Turn ${turnIdx}`);
      lines.push('');
      lines.push(`### You`);
      lines.push('');
      lines.push(msg.content || '');
      lines.push('');
    } else if (msg.role === 'assistant') {
      lines.push(`### LLM Council`);
      lines.push('');

      if (Array.isArray(msg.stage1) && msg.stage1.length) {
        lines.push(`#### Stage 1 — Individual Responses`);
        lines.push('');
        for (const r of msg.stage1) {
          lines.push(`**${r.model}**`);
          lines.push('');
          lines.push(r.response || '');
          lines.push('');
        }
      }

      if (Array.isArray(msg.stage2) && msg.stage2.length) {
        lines.push(`#### Stage 2 — Peer Rankings`);
        lines.push('');
        for (const r of msg.stage2) {
          lines.push(`**${r.model}**`);
          lines.push('');
          lines.push(r.ranking || '');
          lines.push('');
          if (Array.isArray(r.parsed_ranking) && r.parsed_ranking.length) {
            lines.push(`_Parsed: ${r.parsed_ranking.join(' > ')}_`);
            lines.push('');
          }
        }

        const agg = msg.metadata?.aggregate_rankings;
        if (Array.isArray(agg) && agg.length) {
          lines.push(`**Aggregate Rankings**`);
          lines.push('');
          agg.forEach((a, i) => {
            const avg = typeof a.average_rank === 'number' ? a.average_rank.toFixed(2) : a.average_rank;
            lines.push(`${i + 1}. ${a.model} — avg ${avg} (${a.vote_count} votes)`);
          });
          lines.push('');
        }
      }

      if (msg.stage3) {
        lines.push(`#### Stage 3 — Final Council Answer`);
        lines.push('');
        lines.push(`_Chairman: ${msg.stage3.model}_`);
        lines.push('');
        lines.push(msg.stage3.response || '');
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export function downloadConversation(conversation) {
  const md = conversationToMarkdown(conversation);
  const slug = (conversation.title || 'conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'conversation';
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
