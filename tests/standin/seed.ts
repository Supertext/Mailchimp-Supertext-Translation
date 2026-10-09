/**
 * The sample Mailchimp account the stand-in serves: a Swiss chocolate shop
 * that writes its newsletter in English. Two drafts (one made from a
 * template with editable sections, one in plain HTML), a sent campaign and a
 * folder of its own.
 */

export const ACCOUNT = {
  user_id: 48210377,
  accountname: 'Swiss Chocolate Co.',
  dc: 'us21',
  login: { login_name: 'demo' },
};

export const LIST = { id: 'a1b2c3d4e5', name: 'Newsletter' };

export const FOLDERS = [{ id: 'f-seasonal', name: 'Seasonal' }];

const layout = (preheader: string, body: string, footer: string) => `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>*|MC:SUBJECT|*</title>
<!--[if gte mso 15]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
<style type="text/css">body{margin:0;background:#f4efe9;font-family:Helvetica,Arial,sans-serif}.button{background:#5b3a29;color:#fff;padding:12px 24px;border-radius:4px}</style>
</head>
<body>
<span class="mcnPreviewText" style="display:none">*|MC_PREVIEW_TEXT|*</span>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" mc:edit="preheader">${preheader}</td></tr>
<tr><td align="center"><img src="https://mcusercontent.com/demo/images/logo.png" alt="Swiss Chocolate Co. logo" width="160"></td></tr>
<tr><td mc:edit="body">
${body}
</td></tr>
<tr><td mc:edit="footer">
${footer}
</td></tr>
</table>
</body>
</html>`;

const footer = `<p>You are receiving this email because you signed up for our newsletter.</p>
<p><a href="*|UNSUB|*">Unsubscribe</a> · <a href="*|UPDATE_PROFILE|*">Update your preferences</a></p>
<p>*|LIST:ADDRESSLINE|*</p>`;

export const CAMPAIGNS = [
  {
    id: 'c-autumn',
    web_id: 1188201,
    type: 'regular',
    status: 'save',
    content_type: 'template',
    create_time: '2026-10-06T09:12:00+00:00',
    recipients: { list_id: LIST.id, list_name: LIST.name, segment_opts: {} },
    settings: {
      title: 'Autumn newsletter',
      subject_line: 'Our autumn chocolates are here',
      preview_text: 'Three new pralines and a tasting in Zurich',
      from_name: 'Swiss Chocolate Co.',
      reply_to: 'hello@example.com',
      folder_id: '',
      template_id: 10045,
    },
    html: layout(
      '<a href="*|ARCHIVE|*">View this email in your browser</a>',
      `<h1>Hello *|FNAME|*, autumn has arrived</h1>
<p>Our chocolatiers have created <strong>three new pralines</strong> for the season: roasted chestnut, spiced pear and dark caramel with sea salt.</p>
<ul>
<li>Handmade in Zurich from Swiss milk</li>
<li>Free delivery on orders over CHF 50</li>
</ul>
<p>Join us for a <em>free tasting</em> in our Zurich shop on Saturday, 25 October, from 10 am to 4 pm.</p>
<p><a class="button" href="https://www.example.com/autumn">Discover the collection</a></p>`,
      footer,
    ),
  },
  {
    id: 'c-advent',
    web_id: 1188202,
    type: 'regular',
    status: 'save',
    content_type: 'html',
    create_time: '2026-10-03T14:30:00+00:00',
    recipients: { list_id: LIST.id, list_name: LIST.name, segment_opts: { match: 'all', conditions: [{ condition_type: 'Interests', field: 'interests-123', op: 'interestcontains', value: ['456'] }] } },
    settings: {
      title: 'Advent calendar offer',
      subject_line: 'Your Advent calendar is ready to order',
      preview_text: '24 little surprises, made in Switzerland',
      from_name: 'Swiss Chocolate Co.',
      reply_to: 'hello@example.com',
      folder_id: 'f-seasonal',
    },
    html: layout(
      '<a href="*|ARCHIVE|*">View this email in your browser</a>',
      `<h2>24 little surprises</h2>
<p>Our Advent calendar has a different chocolate behind every door. Order before 15 November and we deliver it in time for the first of December.</p>
<p><a class="button" href="https://www.example.com/advent">Order your calendar</a></p>`,
      footer,
    ),
  },
  {
    id: 'c-summer',
    web_id: 1187950,
    type: 'regular',
    status: 'sent',
    content_type: 'html',
    create_time: '2026-07-01T08:00:00+00:00',
    send_time: '2026-07-02T08:00:00+00:00',
    emails_sent: 1840,
    recipients: { list_id: LIST.id, list_name: LIST.name, segment_opts: {} },
    settings: {
      title: 'Summer sale',
      subject_line: 'Summer sale: 20% off ice-cream pralines',
      preview_text: 'Only this week',
      from_name: 'Swiss Chocolate Co.',
      reply_to: 'hello@example.com',
      folder_id: '',
    },
    html: layout('<a href="*|ARCHIVE|*">View this email in your browser</a>', '<p>Our ice-cream pralines are 20% off this week.</p>', footer),
  },
];
