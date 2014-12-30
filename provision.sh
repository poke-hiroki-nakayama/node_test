node_version="0.10.33"
 
#sudo yum -y install git
## nvm insall command
git clone git://github.com/creationix/nvm.git /home/vagrant/.nvm && \
chown vagrant:vagrant -R /home/vagrant/.nvm && \
echo "nvm installed.."
source /home/vagrant/.nvm/nvm.sh
nvm install $node_version 2> /dev/null && \
nvm use v$node_version && \
nvm alias default v$node_version && \
echo "node $node_version installed.."

echo -e 'if [[ -s /home/vagrant/.nvm/nvm.sh ]] ; then source /home/vagrant/.nvm/nvm.sh ; fi' >> /home/vagrant/.bash_profile
# npm global module install path add
export NODE_PATH=`npm root -g`
echo -e 'export NODE_PATH=`npm root -g`' >> /home/vagrant/.bash_profile

# socket.io install command
npm install socket.io -g

## iptables off 
sudo service iptables stop && \
sudo chkconfig iptables off && \
echo -e 'port opened..'
