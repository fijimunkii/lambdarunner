const env = require('./env');
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({
  region: env.get('aws-region') || 'us-east-1'
});
const vpcIds = [ env.get('vpc-id') || 'vpc-671fd003' ];

module.exports = async () => {

  const subnetIds = await ec2.describeSubnets({Filters:[{Name:'vpc-id',Values:vpcIds},{Name:'state',Values:['available']}]}).promise()
    .then(d => d.Subnets.map(d => d.SubnetId));

  const ips = await ec2.describeNetworkInterfaces({Filters:[{Name:'subnet-id',Values:subnetIds},{Name:'description',Values:['']}]}).promise()
    .then(d => d.NetworkInterfaces.map(d => d.PrivateIpAddress));

};
