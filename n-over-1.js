function initialize() {
  render_md_auctions();
  render_md_tables();
  render_text();
}

function render_text() {
  walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  headings = [];
  while (walker.nextNode()) {
    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'TH', 'TD'].includes(walker.currentNode.tagName)) {
      //console.log(walker.currentNode);
      html = walker.currentNode.innerHTML;
      html = replace_suit_symbols(html);
      html = replace_markdown(html);
      walker.currentNode.innerHTML = html;

      if (['H2', 'H3', 'H4'].includes(walker.currentNode.tagName)) {
        walker.currentNode.id = 'heading_' + headings.length;
        headings.push('<a class="toc_' + walker.currentNode.tagName.toLowerCase() + '" href="#' +
                      walker.currentNode.id + '">' + html + '</a>');
      }
    }
  }
  num_columns = 3;
  height = Math.ceil(headings.length / num_columns);
  console.log(headings.length, height);
  toc = '<table>';
  for (i = 0; i < num_columns; ++i) {
    toc += '<td>' + headings.slice(i * height, (i+1) * height).join('\n') + '</td>';
  }
  toc += '</table>';
  document.getElementById('toc').innerHTML = toc;
}

function replace_suit_symbols(text) {
  return text.replace(/\bnt\b/gi, 'NT')
    .replace(/(\bS\b|♠)/gi, '<spades></spades>')
    .replace(/(\bH\b|♥)/gi, '<hearts></hearts>')
    .replace(/(\bD\b|♦)/gi, '<diamonds></diamonds>')
    .replace(/(\bC\b|♣)/gi, '<clubs></clubs>')
    .replace(/([1-7])S\b/gi, function(x, y) { return y + '<spades></spades>'; })
    .replace(/([1-7])H\b/gi, function(x, y) { return y + '<hearts></hearts>'; })
    .replace(/([1-7])D\b/gi, function(x, y) { return y + '<diamonds></diamonds>'; })
    .replace(/([1-7])C\b/gi, function(x, y) { return y + '<clubs></clubs>'; })
    .replace(/\bS([2-9TJQKA]+\b)/gi, function(x, y) { return '<spades></spades>' + y; })
    .replace(/\bH([2-9TJQKA]+\b)/gi, function(x, y) { return '<hearts></hearts>' + y; })
    .replace(/\bD([2-9TJQKA]+\b)/gi, function(x, y) { return '<diamonds></diamonds>' + y; })
    .replace(/\bC([2-9TJQKA]+\b)/gi, function(x, y) { return '<clubs></clubs>' + y; });
}

function replace_markdown(text) {
  return text.replace(/__(.*?)__/g, function(x, y) { return '<u>' + y + '</u>'; })
    .replace(/\*\*(.*?)\*\*/g, function(x, y) { return '<b>' + y + '</b>'; });
}

function render_md_auctions() {
  md_auctions = document.getElementsByClassName('md-auction');
  for (md_auction of md_auctions) {
    new_node = document.createElement("div");
    new_node.innerHTML = render_md_auction(md_auction);
    md_auction.parentNode.insertBefore(new_node, md_auction);
  }
}

function render_md_auction(md_auction) {
  parser = new DOMParser();
  xml_doc = parser.parseFromString(md_auction.innerHTML, "text/xml");
  root = xml_doc.getElementsByTagName('xml')[0];
  style = root.getAttribute('style');
  rows = root.childNodes[0].nodeValue.split('\n').slice(1, -1);
  if (rows[0].split('|').length == 2)
    return render_pair_auction(rows);
  else
    return render_full_auction(rows);
}

function render_pair_auction(rows) {
  hands = ['', ''];
  for (row of rows.slice(0, 4)) {
    suits = row.split('|');
    hands[0] += remove_suit_symbol(suits[0]) + ' ';
    hands[1] += remove_suit_symbol(suits[1]) + ' ';
  }
  bids = ['', ''];
  for (row of rows.slice(4)) {
    items = row.trim().split('|');
    bids[0] = bids[0] == '' ? items[0] : bids[0] + '<br/>' + items[0];
    if (items.length > 1)
      bids[1] = bids[1] == '' ? items[1] : bids[1] + '<br/>' + items[1];
  }
  // Horizontal layout.
  return '<table class="auction">' +
    '<tr>' + hand_to_html(hands[0]) + hand_to_html(hands[1]) +
    '<td class="bid-cmt">' + bids[0] + '</td>' +
    '<td class="bid-cmt">' + bids[1] + '</td>' +
    '</tr> </table>';

  // Vertical layout.
  return '<table class="auction" align="center">' +
    '<tr>' + hand_to_html(hand[0]) + hand_to_html(hand[1]) + '</tr>' +
    '<tr>' +
    '<td class="bid-cmt">' + bids[0] + '</td>' +
    '<td class="bid-cmt">' + bids[1] + '</td>' +
    '</tr> </table>';
}

function render_full_auction(rows) {
  info = '';
  hands = ['', '', '', ''];
  for (row of rows.slice(0, 4)) {
    suits = row.split('|');
    info += suits[0] + '<br/>';
    hands[1] += remove_suit_symbol(suits[1]) + ' ';
  }
  for (row of rows.slice(4, 8)) {
    suits = row.split('|');
    hands[0] += remove_suit_symbol(suits[0]) + ' ';
    hands[2] += remove_suit_symbol(suits[2]) + ' ';
  }
  for (row of rows.slice(8, 12)) {
    suits = row.split('|');
    hands[3] += remove_suit_symbol(suits[1]) + ' ';
  }
  bids = ['', '', '', ''];
  for (row of rows.slice(12)) {
    items = row.split('|');
    bids[0] = bids[0] == '' ? items[0] : bids[0] + '<br/>' + items[0];
    if (items.length > 1)
      bids[1] = bids[1] == '' ? items[1] : bids[1] + '<br/>' + items[1];
    if (items.length > 2)
      bids[2] = bids[2] == '' ? items[2] : bids[2] + '<br/>' + items[2];
    if (items.length > 3)
      bids[3] = bids[3] == '' ? items[3] : bids[3] + '<br/>' + items[3];
  }
  layout = '<table class="auction">' +
    '<tr> <td>' + info + '</td>' + hand_to_html(hands[1]) + '</tr>' +
    '<tr> ' + hand_to_html(hands[0]) + '<td></td>' + hand_to_html(hands[2]) + '</tr>' +
    '<tr> <td></td>' + hand_to_html(hands[3]) + '</tr>' +
    '</table>';
  auction = '<table>' +
    '<td class="bid-cmt">' + bids[0] + '</td>' +
    '<td class="bid-cmt">' + bids[1] + '</td>' +
    '<td class="bid-cmt">' + bids[2] + '</td>' +
    '<td class="bid-cmt">' + bids[3] + '</td>' +
    '</table>';
  return '<table> <td>' + layout + '</td> <td>' + auction + '</td>';
}

function remove_suit_symbol(suit) {
  return suit.replace(/[shdc♠♥♦♣] /gi, '').trim();
}

function render_md_tables() {
  md_tables = document.getElementsByClassName('md-table');
  for (md_table of md_tables) {
    new_node = document.createElement("div");
    new_node.innerHTML = render_md_table(md_table);
    md_table.parentNode.insertBefore(new_node, md_table);
  }
}

function render_md_table(md_table) {
  parser = new DOMParser();
  xml_doc = parser.parseFromString(md_table.innerHTML, "text/xml");
  root = xml_doc.getElementsByTagName('xml')[0];
  style = root.getAttribute('style');
  rows = root.childNodes[0].nodeValue.split('\n');
  html = '<table class="' + style + '">';
  for (i in rows) {
    if (rows[i].trim() == '') continue;
    html += '<tr>';
    for (cell of rows[i].split('|')) {
      html += render_cell(cell, i == 1);
    }
    html += '</tr>';
  }
  return html + '</table>';
}

function render_cell(cell, is_header) {
  regex = /\\[2-9ftb]/g;
  formats = cell.match(regex);
  attr = '';
  if (formats) {
    formats = formats.sort();
    border = 'no';
    for (format of formats) {
      if (format[1] == 'b') {
        border += '-bot';
      } else if (format[1] == 't') {
        border += '-top';
      } else if (format[1] == 'f') {
        attr += ' class="fill"';
      } else if (2 <= format[1] && format[1] <= 9) {
        attr += ' colspan=' + format[1];
      }
    }
    if (border != 'no')
      attr += ' class="' + border + '"';
  }
  cell = cell.replace(regex, '');
  if (cell.match(/[♠S] .* [♥H] .* [♦D] .* [♣C] .*/)) {
    cell = remove_suit_symbol(cell);
    cell = hand_to_html_line(cell);
  }
  if (is_header) {
    return '<th ' + attr + '>' +  cell + '</th>';
  } else {
    return '<td ' + attr + '>' +  cell + '</td>';
  }
}

function count_points(hand) {
  hcp = 0;
  for (i = 0; i < hand.length; ++i) {
    hcp += (hand[i] == 'A') * 4 + (hand[i] == 'K') * 3 +
           (hand[i] == 'Q') * 2 + (hand[i] == 'J') * 1;
  }
  return hcp;
}

function hand_to_html(hand) {
  //hand = hand.toUpperCase();
  hcp = count_points(hand);

  suits = hand.replace(/10/g, 'T').split(' ');
  for (s in suits) {
    len = suits[s].length;
    suits[s] = suits[s]
      .replace(/./g, function (x) { return '&thinsp;' + x; })
      .replace(/\bT\b/g, '10');
    if (len >= 8) {
      percent = 100 - (len - 7) * 6;
      suits[s] = '<small style="font-size:' + percent + '%">' + suits[s] + '</small>';
    }
  }
  html = `
     <td class='hand'>
       <abbr title='${hcp} points'>
         <spades>S</spades> <br/>
         <hearts>H</hearts> <br/>
         <diamonds>D</diamonds> <br/>
         <clubs>C</clubs> <br/>
       </abbr>
     </td>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

function hand_to_html_line(hand) {
  hcp = count_points(hand);

  suits = hand.replace(/10/g, 'T').split(' ');
  for (s in suits) {
    len = suits[s].length;
    suits[s] = suits[s]
      .replace(/./g, function (x) { return '&thinsp;' + x; })
      .replace(/\bT\b/g, '10');
  }
  html = `
       <abbr title='${hcp} points'>
         <spades>S</spades> <hearts>H</hearts> <diamonds>D</diamonds> <clubs>C</clubs>
       </abbr>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

