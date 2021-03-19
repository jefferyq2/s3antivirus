export interface BuildConfig
{
    readonly AWSAccountID : string;
    readonly AWSProfileName : string;
    readonly AWSProfileRegion : string;
    
    readonly App : string;
    readonly Environment : string;
    readonly Version : string;
}