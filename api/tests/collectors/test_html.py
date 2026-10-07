from sararath.collectors.html import html_to_text


def test_paragraph_break():
    assert html_to_text("<p>one</p><p>two</p>") == "one\n\ntwo"


def test_br_is_a_line_break():
    assert html_to_text("a<br>b<br><br>c") == "a\nb\n\nc"


def test_divs_are_lines_and_empty_div_is_a_blank():
    html = "<div>line one</div><div>line two</div><div></div><div>para two</div>"
    assert html_to_text(html) == "line one\nline two\n\npara two"
