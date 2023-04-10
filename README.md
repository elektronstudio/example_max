### About

Code example for integrating [Max 8](https://cycling74.com/products/max) to [elektron.live](http://elektron.live/) platform.

See more docs at https://github.com/elektronstudio/docs

#### Getting it to work with chatgpt:

1. Add the following objects and patches to the `example_max_chat` patch:

   ![](./gpt.png)

2. Update `examples_max.js` from the github page.

3. Create openai.com account, add billing info and Generate a API key https://platform.openai.com/account/api-keys. Copy the key to clipboard.

4. Create a file in the same directory as the examples_max.js, called `.env`

5. Add a OpenAI API key to this file in the following format:

   ```
   OPENAI_API_KEY=sk-w7YoV..rest...of...the...key
   ```

6. Run `script npm install` command in the patch

7. Run `script start` command

8. Add questions to the `gptinput` box, click on the box and wait the answer to appear in `gptoutput` box.
