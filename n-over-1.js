var use_horizontal_layout = false;

function initialize() {
  url_params = new URLSearchParams(window.location.search);
  if (url_params.get('h') != null) {
    use_horizontal_layout = true;
  }

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
                      walker.currentNode.id + '">' + html + '</a><br>');
      }
    }
  }

  document.getElementById('toc').innerHTML = headings.join('\n');
}

function replace_suit_symbols(text) {
  return text.replace(/\bnt\b/gi, 'NT')
    .replace(/(\bS\b|♠)/gi, '<ss></ss>')
    .replace(/(\bH\b|♥)/gi, '<hs></hs>')
    .replace(/(\bD\b|♦)/gi, '<ds></ds>')
    .replace(/(\bC\b|♣)/gi, '<cs></cs>')
    .replace(/([1-7])S\b/gi, function(x, y) { return y + '<ss></ss>'; })
    .replace(/([1-7])H\b/gi, function(x, y) { return y + '<hs></hs>'; })
    .replace(/([1-7])D\b/gi, function(x, y) { return y + '<ds></ds>'; })
    .replace(/([1-7])C\b/gi, function(x, y) { return y + '<cs></cs>'; })
    .replace(/\bS([2-9TJQKA]+\b)/gi, function(x, y) { return '<ss></ss>' + y; })
    .replace(/\bH([2-9TJQKA]+\b)/gi, function(x, y) { return '<hs></hs>' + y; })
    .replace(/\bD([2-9TJQKA]+\b)/gi, function(x, y) { return '<ds></ds>' + y; })
    .replace(/\bC([2-9TJQKA]+\b)/gi, function(x, y) { return '<cs></cs>' + y; });
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

function align_bid_cmt(bid_cmt) {
  space = bid_cmt.includes('NT') ? ' &thinsp; ' :
    bid_cmt.includes('不叫') ? ' &nbsp; ' : ' &ensp;&nbsp; ';
  return bid_cmt.replace(/ - /, space);
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
    items = row.trim().split('|').map(b => align_bid_cmt(b));
    bids[0] = bids[0] == '' ? items[0] : bids[0] + '<br/>' + items[0];
    if (items.length > 1)
      bids[1] = bids[1] == '' ? items[1] : bids[1] + '<br/>' + items[1];
  }
  if (use_horizontal_layout) {
    // Horizontal layout.
    return '<table class="auction">' +
      '<tr>' + hand_to_html(hands[0]) + hand_to_html(hands[1]) +
      '<td class="bid-cmt">' + bids[0] + '</td>' +
      '<td class="bid-cmt">' + bids[1] + '</td>' +
      '</tr> </table>';
  } else {
    // Vertical layout.
    return '<table class="auction">' +
      '<tr>' + hand_to_html(hands[0]) + hand_to_html(hands[1]) + '</tr>' +
      '<tr>' +
      '<td class="bid-cmt">' + bids[0] + '</td>' +
      '<td class="bid-cmt">' + bids[1] + '</td>' +
      '</tr> </table>';
  }
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

function check_hand(hand) {
  cards = hand.replace(/[ -]/g, '');
  if (cards.length != 13)
    console.log('ERROR: ' + cards.length + ' cards with ' + hand);
  if (cards.match(/[x2-9TJQKA]/g).length != 13)
    console.log('ERROR: invalid cards in ' + hand);
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
  check_hand(hand);
  hcp = count_points(hand);

  suits = hand.replace(/10/g, 'T').split(' ');
  for (s in suits) {
    len = suits[s].length;
    suits[s] = suits[s]
      .replace(/./g, function (x) { return '&thinsp;' + x; })
      .replace(/\bT\b/g, '10');
    if (len >= 8) {
      space = len <= 9 ? -1 : -2;
      suits[s] = '<font style="letter-spacing:' + space + 'px">' + suits[s] + '</font>';
    }
  }
  html = `
     <td class='hand'>
       <abbr title='${hcp} points'>
         <ss>S</ss> <br/>
         <hs>H</hs> <br/>
         <ds>D</ds> <br/>
         <cs>C</cs> <br/>
       </abbr>
     </td>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

function hand_to_html_line(hand) {
  check_hand(hand);
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
         <ss>S</ss> <hs>H</hs> <ds>D</ds> <cs>C</cs>
       </abbr>`;
  return html
    .replace(/\bS\b/, suits[0])
    .replace(/\bH\b/, suits[1])
    .replace(/\bD\b/, suits[2])
    .replace(/\bC\b/, suits[3]);
}

