This is a series of messy scripts that will gather the git history of a repository and convert it to the [bulk import format for Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html).

Requires [node](https://nodejs.org/en/) and [bash](https://www.gnu.org/software/bash/).

1. Export git history in json-ish format

This script is based off of the work in this [gist](https://gist.github.com/sergey-shpak/40fe8d2534c5e5941b9db9e28132ca0b).

```bash
git log --pretty=format:'{%n "commit": "%H",%n "abbreviated_commit": "%h",%n "tree": "%T",%n "abbreviated_tree": "%t",%n "parent": "%P",%n "abbreviated_parent": "%p",%n "refs": "%D",%n "encoding": "%e",%n "subject": "%s",%n "sanitized_subject_line": "%f",%n "body": "%b",%n "commit_notes": "%N",%n "verification_flag": "%G?",%n "signer": "%GS",%n "signer_key": "%GK",%n "author": {%n "name": "%aN",%n "email": "%aE",%n "date": "%aD"%n },%n "commiter": {%n "name": "%cN",%n "email": "%cE",%n "date": "%cD"%n }%n},' | sed "$ s/,$//" | sed ':a;N;$!ba;s/\r\n\([^{]\)/\\n\1/g'| awk 'BEGIN { print("[") } { print($0) } END { print("]") }' > history.txt
```

2. Export the file list

```bash
git --no-pager log --name-status > files.txt
```


3. Run the formatter

This will join the history.txt and files.txt files and format them for import to Elasticsearch.

```bash
node git2json.js
```

4. Import to Elasticsearch

This script will upload your file to Elasticsearch:

```bash
./import.sh
```

A copy of the fully formatted finaljson.json file has been gernated, but as long as everything has 

Here's a link to documentation for quickly spinning up an Elastic Stack cluster:
https://searchbetter.dev/blog/quickstart-guide-elastic-stack-for-devs/

```bash
rm history.txt files.txt finaljson.json
```

### Troubleshooting:

*Having a hard time redirecting input on [WSL?](https://docs.microsoft.com/en-us/windows/wsl/install-win10)?*
Try pasting the git commands into a .sh file first, and then redirecting that execution to the file

*Having trouble reading files on Windows or [WSL?](https://docs.microsoft.com/en-us/windows/wsl/install-win10)*
Try converting the file to ascii

In dos:
```dos
cmd /c /a type history.txt>history.txt
cmd /c /a type files.txt>files.txt
```

*Having a hard time with large repositories?*
Elastic will prohibit uploads greater than 100mb by default, you can [change that settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html) but you might be better off [splitting the file up](https://stackoverflow.com/questions/7764755/how-to-split-a-file-into-equal-parts-without-breaking-individual-lines?rq=1) (though make sure to do it only after an even line!)