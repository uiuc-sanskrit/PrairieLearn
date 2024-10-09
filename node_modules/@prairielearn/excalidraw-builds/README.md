# excalidraw-builds

Excalidraw pre-bundled with React.

## Releasing a new version

This repository uses [Changesets](https://github.com/changesets/changesets) to automate the versioning process.

When adding changes that should be released, run the following command and follow the prompts:

```sh
yarn changeset
```

Commit the changeset file that was created and submit it with your PR.

Once the PR is merged, a versioning PR will be opened automatically, and it will stay up to date as additional PRs are merged.

Once you're ready to release a new version, merge the versioning PR and the new version will be published to npm.
