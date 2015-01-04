node_version="0.10.33"
 
sudo yum -y install git
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

# node-redis install command
npm install redis -g

# redis install
sudo rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo yum --enablerepo=epel -y install redis

## iptables off 
sudo service iptables stop && \
sudo chkconfig iptables off && \
echo -e 'port opened..'
## redis on
sudo service redis start && \
sudo chkconfig redis on && \
echo -e 'redis started..'
