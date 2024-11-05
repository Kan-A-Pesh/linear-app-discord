import 'dotenv/config';

import express, { Request } from 'express';
import { IncomingLinearWebhookPayload } from './types';
import fetch from 'node-fetch';

const app = express();

const port: number = parseInt(process.env.PORT ?? '3000');

app.use(express.json());

app.post<Request['params'], unknown, IncomingLinearWebhookPayload>('/linear', async (req, res) => {
  const payload = req.body;

  console.log("RECEIVED DATA", new Date());
  
  if (payload.action === 'create' && payload.type === 'Issue') {
     const res = await newIssue(payload)
     console.log(res)
     console.log(await res.text())
  }

  res.sendStatus(200);
});

app.listen(port, () => console.log(`Webhook consumer listening on port ${port}!`));

function newIssue(payload: IncomingLinearWebhookPayload) {
  console.log("payload", payload);
  
  const body = JSON.stringify({
      embeds: [
        {
          color: 0x4752b2,
          author: {
            name: `Issue Created [#${payload.data.number}]`,
          },
          title: payload.data.title,
          url: payload.url,
          description: payload.data.description,
          fields: [
            {
              name: 'Priority',
              value: payload.data.priorityLabel,
              inline: true,
            },
            {
              name: 'Points',
              value: payload.data.estimate ?? "None",
              inline: true,
            },
            {
              name: 'Labels',
              value: prettifyLabels(payload.data.labels!) ?? "N/A",
              inline: true,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: payload.actor.name,
            icon_url: payload.actor.avatarUrl,
          },
        },
      ],
    });

  console.log("body", body);
  
  return fetch(process.env.WEBHOOK!, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: body
  });
}

/**
 * Formats and prettifies label(s)
 * @param labels connected labels
 */
function prettifyLabels(labels: NonNullable<IncomingLinearWebhookPayload['data']['labels']>) {
  return labels.map((label) => label.name).join(', ');
}
