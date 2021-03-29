const avConfig = {
  efsPath: '/lambda',
  mountpoint: '/mnt/lambda',
  avDefS3KeyPrefix: 'avdefinitions',
  maxFileSize: (2 ** 31)
};

export { avConfig };
