# @bluecateng/git-check-push

Validation for Git push hook.

## Usage

Follow installation instructions for [husky](https://typicode.github.io/husky/#/?id=usage) and then:

```shell
npm i @bluecateng/git-check-push
```

```shell
npx husky add .husky/pre-push 'npx @bluecateng/git-check-push "$1"'
```
