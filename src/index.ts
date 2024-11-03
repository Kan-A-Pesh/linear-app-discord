import 'dotenv/config';

import express, { Request } from 'express';
import { IncomingLinearWebhookPayload } from './types';
import fetch from 'node-fetch';

const app = express();

const port: number = parseInt(process.env.PORT ?? '3000');

app.use(express.json());

app.post<Request['params'], unknown, IncomingLinearWebhookPayload>('/linear', async (req, res) => {
  const payload = req.body;
  
  if (payload.action === 'create' && payload.type === 'Issue') {
     await newIssue(payload);
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
              value: getPriorityValue(payload.data.priority ?? 0),
              inline: true,
            },
            {
              name: 'Points',
              value: payload.data.estimate ?? "None",
              inline: true,
            },,
            {
              name: "Created by",
              value: payload.actor.name,
              inline: true,
            },
            {
              name: 'Labels',
              value: prettifyLabels(payload.data.labels!),
              inline: true,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: `Linear App`,
            icon_url: 'https://pbs.twimg.com/profile_images/1121592030449168385/MF6whgy1_400x400.png',
          },
        },
      ],
    });

  console.log("body", body);
  
  return fetch(process.env.WEBHOOK!, {
    method: 'POST',
    body: body
  });
}

/**
 * Get the Priority Value translated
 * @param priority number for priority
 */
function getPriorityValue(priority: NonNullable<IncomingLinearWebhookPayload['data']['priority']>) {
  switch (priority) {
    case 1:
      return 'Urgent';
    case 2:
      return 'High';
    case 3:
      return 'Medium';
    case 4:
      return 'Low';
    default:
      return 'None';
  }
}

/**
 * Formats and prettifies label(s)
 * @param labels connected labels
 */
function prettifyLabels(labels: NonNullable<IncomingLinearWebhookPayload['data']['labels']>) {
  return labels.map((label) => label.name).join(', ');
}
