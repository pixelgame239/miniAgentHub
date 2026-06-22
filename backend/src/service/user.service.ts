import { prisma } from "../../lib/prisma";

export class UserService{
    public async getAllUsers(){
        const response = await prisma.user.findMany({select:{
            id:true,
            fullname:true,
            email:true,
            groups: {
                select:{
                    id: true,
                    groupName: true
                }
            },
            active:true
        }});
        return response;
    }
    public async updateUser(userId: number, formData: any){
        const response = await prisma.user.update({where:{
            id: userId
        }, data:{
            fullname: formData.fullname,
            groups:{
                set: formData.groups.map((id:number)=>({id:id}))
            }
        }, include:{
            groups:true
        }});
        return response;
    }
    public async deleteUser(userId:number){
        const response = await prisma.user.delete({where:{id: userId}});
        return response;
    }
    public async getGroupUsers(groupId:number){
        const response = await prisma.user.findMany({where:{
            groups:{
                some:{
                    id:groupId
                }
            }
        }, select:{
            id:true,
            fullname:true,
            email:true,
            groups: {
                select:{
                    id: true,
                    groupName: true
                }
            },
        }});
        return response;
    }
    public async queryUser(input: string) {
        const response = await prisma.user.findMany({
            where: {
                OR: [
                    { 
                        email: { 
                            contains: input, 
                            mode: 'insensitive' 
                        } 
                    },
                    { 
                        fullname: { 
                            contains: input, 
                            mode: 'insensitive' 
                        } 
                    }
                ]
            },
            take: 10,
            select:{
                id:true,
                fullname: true,
                email:true
            }
        });
        
        return response;
    }
    public async updateAddress(userId: number, address: string){
        const response = await prisma.user.update({
            where: { id: userId },
            data: { address }
        });
        return response;
    }
    public async updatePhoneNumber(userId: number, phoneNumber: string){
        const response = await prisma.user.update({
            where: { id: userId },
            data: { phoneNumber }
        });
        return response;
    }
    public async setAPIKey(userId: number, APIKey: string){
        const response = await prisma.user.update({
            where: { id: userId },
            data: { APIKey }
        });
        return response;
    }
}