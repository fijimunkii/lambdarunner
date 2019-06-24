const env = require('./env');
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({
  region: env.get('aws-region') || 'us-east-1'
});
const cloudwatch = new AWS.CloudWatch({
  region: env.get('aws-region') || 'us-east-1',
  apiVersion: '2010-08-01'
});

const vpcIds = [ env.get('vpc-id') || 'vpc-671fd003' ];
const autoscalingGroup = env.get('autoscaling-group') || '';

module.exports = async () => {

  const subnetIds = await ec2.describeSubnets({Filters:[{Name:'vpc-id',Values:vpcIds},{Name:'state',Values:['available']}]}).promise()
    .then(d => d.Subnets.map(d => d.SubnetId));

  const ips = await ec2.describeNetworkInterfaces({Filters:[{Name:'subnet-id',Values:subnetIds},{Name:'description',Values:['']}]}).promise()
    .then(d => d.NetworkInterfaces.map(d => d.PrivateIpAddress));

  // How to determine IPs to use
  //
  // Adaptive Load Balancing
  // - check cloudwatch (30s cache invalidation)
  // Chained Failover (Fixed Weighted)
  // - return ordered list of ips
  const loads = await cloudwatch.getMetricData({
    StartTime: new Date,
    EndTime: new Date,
    MetricDataQueries: [{
      Id: 'load',
      MetricStat: {
        Metric: {
          Dimensions: [ { Name: 'AutoScalingGroupName', Value: autoscalingGroup } ],
          MetricName: 'CPUUtilization',
          Namespace: 'AWS/EC2'
        },
        Period: 60,
        Stat: 'Average',
        Unit: 'Percent'
      },
      ReturnData: true
    }],
  }).promise().then(d => d.Metrics);

  const orderedIps = [];

  return orderedIps;
};
