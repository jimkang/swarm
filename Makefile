PROJECTNAME = swarm
HOMEDIR = $(shell pwd)
USER = bot
SERVER = smallcatlabs
SSHCMD = ssh $(USER)@$(SERVER)
APPDIR = /opt/$(PROJECTNAME)

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(USER)@$(SERVER):/opt/ --exclude node_modules/ --exclude data/
	$(SSHCMD) "cd $(APPDIR) && npm install"

# check-log:
	# $(SSHCMD) "journalctl -r -u $(PROJECTNAME)"

run-multiple:
	number=1 ; while [[ $$number -le 10 ]] ; do \
		node swarm-post.js --dry; \
		((number = number + 1)) ; \
	done
