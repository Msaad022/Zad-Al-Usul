# Role-check actions

## Environment variables

Add to `.env` (or your host’s env):

- `CLOUDINARY_CLOUD_NAME` – Cloudinary cloud name
- `CLOUDINARY_API_KEY` – Cloudinary API key
- `CLOUDINARY_API_SECRET` – Cloudinary API secret
- `ASSEMBLYAI_API_KEY` – AssemblyAI API key

For production DB (Turso / Astro DB remote):

- `ASTRO_DB_REMOTE_URL` – libSQL URL
- `ASTRO_DB_APP_TOKEN` – DB token

## Calling actions from forms

### Upload (new question)

```html
<form
  method="POST"
  action="{actions.upload.question}"
  enctype="multipart/form-data"
>
  <input type="text" name="typeque" required minlength="8" />
  <textarea name="question" required minlength="8"></textarea>
  <textarea name="answer" required minlength="8"></textarea>
  <textarea name="description" required minlength="300"></textarea>
  <input type="file" name="audiofile" accept="audio/*" required />
  <button type="submit">إرسال</button>
</form>
```

- Field names must be: `typeque`, `question`, `answer`, `description`, `audiofile`.
- Audio: required, audio only, max 1MB.
- On success the action returns `{ success: true, id, slug }`; you can redirect to `/role-check/update/{slug}`.

### Search

```html
<form method="POST" action="{actions.search.question}">
  <input type="search" name="search" minlength="1" />
  <button type="submit">بحث</button>
</form>
```

- Use `getActionResult(actions.search.question)` to get `data.results` (list of `{ id, type_que, question, slug }`) or `data.message` ("السؤال غير موجود").

### Update (edit question)

```html
<form
  method="POST"
  action="{actions.update.question}"
  enctype="multipart/form-data"
>
  <input type="hidden" name="slug" value="{slug}" />
  <input
    type="text"
    name="typeque"
    value="{question.type_que}"
    required
    minlength="8"
  />
  <textarea name="question" required minlength="8">
{question.question}</textarea
  >
  <textarea name="answer" required minlength="8">{question.answer}</textarea>
  <textarea name="description" required minlength="300">
{question.description}</textarea
  >
  <input type="file" name="audiofile" accept="audio/*" />
  <button type="submit">حفظ التعديلات</button>
</form>
```

- `slug` is the question id (e.g. from `/role-check/update/1` use `1`).
- `audiofile` is optional; if omitted, existing audio/transcription is kept.

## Error handling

- Validation errors: use `isInputError(result?.error)` and `result.error.fields` for per-field messages.
- Other errors: `result?.error?.type === "AstroActionError"` and `result.error.message` for a single message.
