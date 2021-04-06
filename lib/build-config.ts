export interface BuildConfig
{
    readonly AWSAccountID : string;
    readonly AWSProfileName : string;
    readonly AWSRegions : string[];
    readonly VpcCidr : string;

    readonly App : string;
    readonly Environment : string;
    readonly Version : string;
}
