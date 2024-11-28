all: n-over-1.pdf

n-over-1.book.html: n-over-1.html n-over-1.js n-over-1.css
	chromium --headless --dump-dom n-over-1.html | grep -vE 'n-over-1.js|n-over-1.css' > $@

n-over-1.pdf: n-over-1.book.html n-over-1.css n-over-1.book.css
	weasyprint -s n-over-1.css -s n-over-1.book.css n-over-1.book.html $@
