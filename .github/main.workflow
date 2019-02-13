workflow "New workflow" {
  on = "push"
  resolves = ["Publish"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Test" {
  uses = "actions/npm@master"
  args = "run cover"
  needs = ["Install"]
}

action "Only if new TAG" {
  uses = "actions/bin/filter@master"
  needs = ["Test"]
  args = "tag"
}

action "Publish" {
  uses = "actions/npm@4633da3702a5366129dca9d8cc3191476fc3433c"
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
  needs = ["Only if new TAG"]
}
